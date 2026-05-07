(function () {
  if (globalThis.__linkedinProfileMarkerLoaded__) {
    return;
  }

  globalThis.__linkedinProfileMarkerLoaded__ = true;

  const backendBaseUrlStorageKey = '__backendBaseUrl';
  const defaultBackendBaseUrl = 'http://localhost:8080';
  const markerClassName = 'linkedin-profile-known-marker';
  const markerRefreshIntervalMs = 60000;
  const backendRequestTimeoutMs = 6000;

  let backendBaseUrl = defaultBackendBaseUrl;
  let knownProfileUrls = new Set();
  let scanTimer = null;

  function isExtensionContextValid() {
    try {
      return typeof chrome !== 'undefined' && !!chrome.runtime?.id;
    } catch (_error) {
      return false;
    }
  }

  function normalizeBackendBaseUrl(rawValue) {
    const input = String(rawValue || '').trim();
    if (!input) {
      return null;
    }

    try {
      const url = new URL(input);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        return null;
      }
      url.search = '';
      url.hash = '';
      const normalized = url.toString();
      return normalized.endsWith('/') ? normalized.slice(0, -1) : normalized;
    } catch (_error) {
      return null;
    }
  }

  function isLinkedInProfileUrl(url) {
    const host = String(url.hostname || '').toLowerCase();
    const linkedInHost = host === 'www.linkedin.com' || host === 'linkedin.com';
    if (!linkedInHost) {
      return false;
    }

    return String(url.pathname || '').startsWith('/in/');
  }

  function canonicalizeProfileUrl(rawUrl) {
    try {
      const url = new URL(rawUrl, globalThis.location.origin);
      if (!isLinkedInProfileUrl(url)) {
        return null;
      }

      url.search = '';
      url.hash = '';

      if (url.pathname.endsWith('/overlay/contact-info/')) {
        url.pathname = url.pathname.replace(/\/overlay\/contact-info\/$/, '/');
      }

      return url.toString();
    } catch (_error) {
      return null;
    }
  }

  function loadBackendBaseUrl() {
    return new Promise((resolve) => {
      if (!isExtensionContextValid()) {
        resolve(defaultBackendBaseUrl);
        return;
      }

      try {
        chrome.storage.local.get([backendBaseUrlStorageKey], (result) => {
          if (!isExtensionContextValid()) {
            resolve(defaultBackendBaseUrl);
            return;
          }

          if (chrome.runtime.lastError) {
            resolve(defaultBackendBaseUrl);
            return;
          }

          const normalized = normalizeBackendBaseUrl(result[backendBaseUrlStorageKey]);
          resolve(normalized || defaultBackendBaseUrl);
        });
      } catch (_error) {
        resolve(defaultBackendBaseUrl);
      }
    });
  }

  async function backendRequest(path, options) {
    const controller = new AbortController();
    const timeoutHandle = globalThis.setTimeout(() => controller.abort(), backendRequestTimeoutMs);

    try {
      const response = await fetch(`${backendBaseUrl}${path}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(options?.headers || {}),
        },
        signal: controller.signal,
      });

      let data = null;
      try {
        data = await response.json();
      } catch (_error) {
        data = null;
      }

      return {
        ok: response.ok,
        status: response.status,
        data,
      };
    } finally {
      globalThis.clearTimeout(timeoutHandle);
    }
  }

  async function refreshKnownProfilesFromBackend() {
    backendBaseUrl = await loadBackendBaseUrl();

    try {
      const result = await backendRequest('/profiles', { method: 'GET' });
      if (!result.ok || !result.data || typeof result.data !== 'object') {
        return;
      }

      const next = new Set();
      for (const rawUrl of Object.keys(result.data)) {
        const canonical = canonicalizeProfileUrl(rawUrl);
        if (canonical) {
          next.add(canonical);
        }
      }

      knownProfileUrls = next;
    } catch (_error) {
      // Keep previous marker set on transient failures.
    }
  }

  function ensureMarker(anchor) {
    const existing = anchor.querySelector(`:scope > span.${markerClassName}`);
    if (existing) {
      return;
    }

    const marker = document.createElement('span');
    marker.className = markerClassName;
    marker.textContent = '✓';
    marker.style.display = 'inline-block';
    marker.style.marginLeft = '0.2em';
    marker.style.color = '#22c55e';
    marker.style.fontSize = '1em';
    marker.style.lineHeight = '1';
    marker.style.fontWeight = '700';
    marker.style.verticalAlign = 'baseline';

    anchor.appendChild(marker);
  }

  function removeMarker(anchor) {
    const existing = anchor.querySelector(`:scope > span.${markerClassName}`);
    if (existing) {
      existing.remove();
    }
  }

  function scanAndMarkLinks() {
    const anchors = document.querySelectorAll('a[href]');
    for (const anchor of anchors) {
      const href = anchor.getAttribute('href');
      if (!href) {
        continue;
      }

      const canonical = canonicalizeProfileUrl(href);
      if (!canonical || !knownProfileUrls.has(canonical)) {
        removeMarker(anchor);
        continue;
      }

      ensureMarker(anchor);
    }
  }

  function scheduleScan() {
    if (scanTimer !== null) {
      globalThis.clearTimeout(scanTimer);
    }

    scanTimer = globalThis.setTimeout(() => {
      scanAndMarkLinks();
      scanTimer = null;
    }, 120);
  }

  const observer = new MutationObserver(() => {
    scheduleScan();
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['href'],
  });

  (async () => {
    await refreshKnownProfilesFromBackend();
    scanAndMarkLinks();
  })();

  globalThis.setInterval(async () => {
    await refreshKnownProfilesFromBackend();
    scanAndMarkLinks();
  }, markerRefreshIntervalMs);
})();
