(function () {
  if (globalThis.__floatingSelectorPanelLoaded__) {
    return;
  }

  globalThis.__floatingSelectorPanelLoaded__ = true;

  const panel = document.createElement('div');
  panel.id = 'floating-selector-panel';
  panel.style.position = 'fixed';
  panel.style.top = '120px';
  panel.style.right = '16px';
  panel.style.zIndex = '2147483647';
  panel.style.display = 'flex';
  panel.style.flexDirection = 'column';
  panel.style.alignItems = 'stretch';
  panel.style.gap = '8px';
  panel.style.padding = '12px';
  panel.style.background = 'rgba(15, 23, 42, 0.92)';
  panel.style.boxShadow = '0 10px 30px rgba(15, 23, 42, 0.18)';
  panel.style.fontFamily = 'system-ui, sans-serif';
  panel.style.boxSizing = 'border-box';
  panel.style.border = '1px solid rgba(148, 163, 184, 0.3)';
  panel.style.borderRadius = '12px';
  panel.style.width = '240px';
  panel.style.maxHeight = 'calc(100vh - 140px)';
  panel.style.overflowY = 'auto';

  const title = document.createElement('div');
  title.textContent = 'Selector';
  title.style.color = '#f8fafc';
  title.style.fontSize = '13px';
  title.style.fontWeight = '600';
  panel.appendChild(title);

  const status = document.createElement('div');
  status.textContent = 'Készen áll';
  status.style.color = '#cbd5e1';
  status.style.fontSize = '12px';
  panel.appendChild(status);

  const lastUpdated = document.createElement('div');
  lastUpdated.textContent = 'Utolso frissites: -';
  lastUpdated.style.color = '#94a3b8';
  lastUpdated.style.fontSize = '12px';
  panel.appendChild(lastUpdated);

  const shortcuts = document.createElement('div');
  shortcuts.textContent = 'Ctrl+Alt+1..7 mezovalsztas, Ctrl+Alt+0 panel eloterbe';
  shortcuts.style.color = '#94a3b8';
  shortcuts.style.fontSize = '12px';
  panel.appendChild(shortcuts);

  const backendInfo = document.createElement('div');
  backendInfo.textContent = 'Backend: ismeretlen';
  backendInfo.style.color = '#94a3b8';
  backendInfo.style.fontSize = '12px';
  panel.appendChild(backendInfo);

  const backendUrlLabel = document.createElement('div');
  backendUrlLabel.textContent = 'Backend URL';
  backendUrlLabel.style.color = '#94a3b8';
  backendUrlLabel.style.fontSize = '12px';
  panel.appendChild(backendUrlLabel);

  const backendUrlInputRow = document.createElement('div');
  backendUrlInputRow.style.display = 'flex';
  backendUrlInputRow.style.gap = '6px';
  backendUrlInputRow.style.alignItems = 'center';

  const backendUrlInput = document.createElement('input');
  backendUrlInput.type = 'text';
  backendUrlInput.placeholder = 'http://localhost:8080';
  backendUrlInput.style.flex = '1';
  backendUrlInput.style.minWidth = '0';
  backendUrlInput.style.border = '1px solid rgba(148, 163, 184, 0.4)';
  backendUrlInput.style.borderRadius = '8px';
  backendUrlInput.style.padding = '6px 8px';
  backendUrlInput.style.background = 'rgba(30, 41, 59, 0.9)';
  backendUrlInput.style.color = '#e2e8f0';
  backendUrlInput.style.fontSize = '12px';

  const backendUrlSaveButton = document.createElement('button');
  backendUrlSaveButton.type = 'button';
  backendUrlSaveButton.textContent = 'Save';
  backendUrlSaveButton.style.border = 'none';
  backendUrlSaveButton.style.borderRadius = '8px';
  backendUrlSaveButton.style.padding = '6px 10px';
  backendUrlSaveButton.style.background = '#bae6fd';
  backendUrlSaveButton.style.color = '#0c4a6e';
  backendUrlSaveButton.style.fontSize = '12px';
  backendUrlSaveButton.style.fontWeight = '600';
  backendUrlSaveButton.style.cursor = 'pointer';

  backendUrlInputRow.appendChild(backendUrlInput);
  backendUrlInputRow.appendChild(backendUrlSaveButton);
  panel.appendChild(backendUrlInputRow);

  const highlightStyle = document.createElement('style');
  highlightStyle.textContent = `
    .floating-selector-hover {
      outline: 2px solid #22c55e !important;
      cursor: crosshair !important;
    }
  `;
  document.documentElement.appendChild(highlightStyle);

  const importInput = document.createElement('input');
  importInput.type = 'file';
  importInput.accept = 'application/json,.json';
  importInput.style.display = 'none';

  let activeField = null;
  let hoveredElement = null;
  let promoteTimer = null;
  let profileRefreshIntervalId = null;
  let lastSyncedProfileUrl = '';
  const backendBaseUrlStorageKey = '__backendBaseUrl';
  const defaultBackendBaseUrl = 'http://localhost:8080';
  const profileStorageCleanupFlagKey = '__profileStorageCanonicalCleanupDoneV1';
  const profileLastUpdatedKey = 'LastUpdatedAt';
  const experienceFieldLabel = 'Add Experience';
  const experienceStorageKey = 'Experiences';
  const fieldLabels = [
    'Name',
    'Headline',
    'Location',
    'NumOfContacts',
    'Contact',
    'Info',
    experienceFieldLabel,
  ];
  const fieldKeyMap = {
    Digit1: 'Name',
    Digit2: 'Headline',
    Digit3: 'Location',
    Digit4: 'NumOfContacts',
    Digit5: 'Contact',
    Digit6: 'Info',
    Digit7: experienceFieldLabel,
  };
  const fieldHotkeyMap = {
    Name: '1',
    Headline: '2',
    Location: '3',
    NumOfContacts: '4',
    Contact: '5',
    Info: '6',
    [experienceFieldLabel]: '7',
  };
  let hotkeyHintsVisible = false;
  let backendBaseUrl = defaultBackendBaseUrl;
  const backendRequestTimeoutMs = 6000;

  function supportsPopover() {
    return 'showPopover' in panel && 'hidePopover' in panel;
  }

  function promotePanelToFront() {
    if (!supportsPopover()) {
      return;
    }

    if (panel.matches(':popover-open')) {
      panel.hidePopover();
    }

    panel.showPopover();
  }

  function schedulePanelPromotion() {
    if (!supportsPopover()) {
      return;
    }

    if (promoteTimer !== null) {
      globalThis.clearTimeout(promoteTimer);
    }

    promoteTimer = globalThis.setTimeout(() => {
      promotePanelToFront();
      promoteTimer = null;
    }, 0);
  }

  function setStatus(message) {
    status.textContent = message;
  }

  function setBackendStatus(message) {
    backendInfo.textContent = `Backend: ${message}`;
  }

  function isExtensionContextValid() {
    try {
      return typeof chrome !== 'undefined' && !!chrome.runtime?.id;
    } catch (_error) {
      return false;
    }
  }

  function handleInvalidExtensionContext() {
    setStatus('Extension ujratoltve, frissitsd az oldalt');
    setBackendStatus('context invalid');
    if (profileRefreshIntervalId !== null) {
      globalThis.clearInterval(profileRefreshIntervalId);
      profileRefreshIntervalId = null;
    }
  }

  function safeStorageGet(keys, onSuccess) {
    if (!isExtensionContextValid()) {
      handleInvalidExtensionContext();
      return;
    }

    try {
      chrome.storage.local.get(keys, (result) => {
        if (!isExtensionContextValid()) {
          handleInvalidExtensionContext();
          return;
        }
        if (chrome.runtime.lastError) {
          if (String(chrome.runtime.lastError.message).includes('Extension context invalidated')) {
            handleInvalidExtensionContext();
          }
          return;
        }
        onSuccess(result);
      });
    } catch (error) {
      if (String(error).includes('Extension context invalidated')) {
        handleInvalidExtensionContext();
        return;
      }
      throw error;
    }
  }

  function safeStorageSet(data, onSuccess) {
    if (!isExtensionContextValid()) {
      handleInvalidExtensionContext();
      return;
    }

    try {
      chrome.storage.local.set(data, () => {
        if (!isExtensionContextValid()) {
          handleInvalidExtensionContext();
          return;
        }
        if (chrome.runtime.lastError) {
          if (String(chrome.runtime.lastError.message).includes('Extension context invalidated')) {
            handleInvalidExtensionContext();
          }
          return;
        }
        if (onSuccess) {
          onSuccess();
        }
      });
    } catch (error) {
      if (String(error).includes('Extension context invalidated')) {
        handleInvalidExtensionContext();
        return;
      }
      throw error;
    }
  }

  function safeStorageClear(onSuccess) {
    if (!isExtensionContextValid()) {
      handleInvalidExtensionContext();
      return;
    }

    try {
      chrome.storage.local.clear(() => {
        if (!isExtensionContextValid()) {
          handleInvalidExtensionContext();
          return;
        }
        if (chrome.runtime.lastError) {
          if (String(chrome.runtime.lastError.message).includes('Extension context invalidated')) {
            handleInvalidExtensionContext();
          }
          return;
        }
        if (onSuccess) {
          onSuccess();
        }
      });
    } catch (error) {
      if (String(error).includes('Extension context invalidated')) {
        handleInvalidExtensionContext();
        return;
      }
      throw error;
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

  function getPreservedStorageMeta(existingData) {
    const preserved = {};

    if (Object.prototype.hasOwnProperty.call(existingData, backendBaseUrlStorageKey)) {
      preserved[backendBaseUrlStorageKey] = existingData[backendBaseUrlStorageKey];
    }

    if (Object.prototype.hasOwnProperty.call(existingData, profileStorageCleanupFlagKey)) {
      preserved[profileStorageCleanupFlagKey] = existingData[profileStorageCleanupFlagKey];
    }

    return preserved;
  }

  function replaceStorageWithProfiles(nextProfileData, successMessage) {
    safeStorageGet(null, (existingData) => {
      const replacementStore = {
        ...getPreservedStorageMeta(existingData),
        ...(nextProfileData || {}),
      };

      safeStorageClear(() => {
        safeStorageSet(replacementStore, () => {
          if (successMessage) {
            setStatus(successMessage);
          }
          refreshPanelForCurrentProfile(true);
          checkBackendConnection();
        });
      });
    });
  }

  function saveBackendBaseUrlFromInput() {
    const normalized = normalizeBackendBaseUrl(backendUrlInput.value);
    if (!normalized) {
      setStatus('Ervenytelen Backend URL (http/https)');
      return;
    }

    backendBaseUrl = normalized;
    backendUrlInput.value = normalized;

    safeStorageSet({ [backendBaseUrlStorageKey]: normalized }, () => {
      setStatus(`Backend URL mentve: ${normalized}`);
      checkBackendConnection();
    });
  }

  function loadBackendBaseUrlConfig(onDone) {
    safeStorageGet([backendBaseUrlStorageKey], (result) => {
      const storedValue = result[backendBaseUrlStorageKey];
      const normalized = normalizeBackendBaseUrl(storedValue);

      if (normalized) {
        backendBaseUrl = normalized;
      } else {
        backendBaseUrl = defaultBackendBaseUrl;
      }

      backendUrlInput.value = backendBaseUrl;
      if (onDone) {
        onDone();
      }
    });
  }

  function formatLastUpdated(timestamp) {
    if (!timestamp) {
      return '-';
    }

    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) {
      return '-';
    }

    return date.toLocaleString();
  }

  function setLastUpdatedDisplay(timestamp) {
    lastUpdated.textContent = `Utolso frissites: ${formatLastUpdated(timestamp)}`;
  }

  function clearHoveredElement() {
    if (hoveredElement) {
      hoveredElement.classList.remove('floating-selector-hover');
      hoveredElement = null;
    }
  }

  function stopSelectionMode() {
    activeField = null;
    clearHoveredElement();
    setStatus('Készen áll');
  }

  function startSelectionMode(fieldName) {
    activeField = fieldName;
    setStatus(`${fieldName}: válassz ki egy elemet`);
  }

  function getStorageProfileUrl() {
    const url = new URL(globalThis.location.href);

    // Always use a canonical profile key so locale/query variants share the same storage entry.
    url.search = '';
    url.hash = '';

    if (url.pathname.endsWith('/overlay/contact-info/')) {
      url.pathname = url.pathname.replace(/\/overlay\/contact-info\/$/, '/');
    }

    return url.toString();
  }

  function isProfileStorageKey(key) {
    return typeof key === 'string' && (key.startsWith('http://') || key.startsWith('https://'));
  }

  function canonicalizeProfileStorageUrl(rawUrl) {
    try {
      const url = new URL(rawUrl);
      url.search = '';
      url.hash = '';

      if (url.pathname.endsWith('/overlay/contact-info/')) {
        url.pathname = url.pathname.replace(/\/overlay\/contact-info\/$/, '/');
      }

      return url.toString();
    } catch (_error) {
      const queryIndex = rawUrl.indexOf('?');
      const fragmentIndex = rawUrl.indexOf('#');
      let cutIndex = rawUrl.length;

      if (queryIndex >= 0) {
        cutIndex = Math.min(cutIndex, queryIndex);
      }
      if (fragmentIndex >= 0) {
        cutIndex = Math.min(cutIndex, fragmentIndex);
      }

      return rawUrl.slice(0, cutIndex);
    }
  }

  function isBlankValue(value) {
    return value === undefined || value === null || String(value).trim() === '';
  }

  function parseTimestamp(value) {
    if (isBlankValue(value)) {
      return null;
    }

    const date = new Date(String(value));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function mergeProfileStorageData(baseProfile, incomingProfile) {
    const merged = { ...baseProfile };

    for (const [key, incomingValue] of Object.entries(incomingProfile || {})) {
      if (key === experienceStorageKey) {
        const existing = Array.isArray(merged[experienceStorageKey])
          ? merged[experienceStorageKey]
          : [];
        const incoming = Array.isArray(incomingValue) ? incomingValue : [];
        const unique = [];
        const seen = new Set();

        for (const item of existing.concat(incoming)) {
          const normalized = String(item || '').trim();
          if (!normalized || seen.has(normalized)) {
            continue;
          }
          seen.add(normalized);
          unique.push(normalized);
        }

        merged[experienceStorageKey] = unique;
        continue;
      }

      if (key === profileLastUpdatedKey) {
        const currentDate = parseTimestamp(merged[profileLastUpdatedKey]);
        const incomingDate = parseTimestamp(incomingValue);

        if (!currentDate && incomingDate) {
          merged[profileLastUpdatedKey] = incomingValue;
        } else if (currentDate && incomingDate && incomingDate > currentDate) {
          merged[profileLastUpdatedKey] = incomingValue;
        }
        continue;
      }

      if (!Object.prototype.hasOwnProperty.call(merged, key) || isBlankValue(merged[key])) {
        merged[key] = incomingValue;
      }
    }

    return merged;
  }

  function runOneTimeStorageCleanup(onDone) {
    safeStorageGet(null, (allData) => {
      if (allData[profileStorageCleanupFlagKey]) {
        if (onDone) {
          onDone();
        }
        return;
      }

      const nextStore = {};
      const mergedProfiles = {};

      let scannedProfiles = 0;
      let normalizedProfiles = 0;

      for (const [key, value] of Object.entries(allData || {})) {
        if (!isProfileStorageKey(key) || !value || typeof value !== 'object' || Array.isArray(value)) {
          nextStore[key] = value;
          continue;
        }

        scannedProfiles += 1;
        const canonicalKey = canonicalizeProfileStorageUrl(key);
        if (canonicalKey !== key) {
          normalizedProfiles += 1;
        }

        if (!mergedProfiles[canonicalKey]) {
          mergedProfiles[canonicalKey] = { ...value };
        } else {
          mergedProfiles[canonicalKey] = mergeProfileStorageData(mergedProfiles[canonicalKey], value);
        }
      }

      const canonicalKeys = Object.keys(mergedProfiles);
      for (const canonicalKey of canonicalKeys) {
        nextStore[canonicalKey] = mergedProfiles[canonicalKey];
      }

      nextStore[profileStorageCleanupFlagKey] = true;

      const mergedDuplicates = scannedProfiles - canonicalKeys.length;

      safeStorageClear(() => {
        safeStorageSet(nextStore, () => {
          console.log('Storage canonical cleanup completed once.', {
            scannedProfiles,
            canonicalProfiles: canonicalKeys.length,
            normalizedProfiles,
            mergedProfiles: mergedDuplicates,
          });

          if (onDone) {
            onDone();
          }
        });
      });
    });
  }

  function getEncodedProfileUrl(profileUrl) {
    return encodeURIComponent(encodeURIComponent(profileUrl));
  }

  function getBackendProfilePath(profileUrl) {
    return `/profiles/${getEncodedProfileUrl(profileUrl)}`;
  }

  function getBackendFieldPath(profileUrl, fieldName) {
    return `${getBackendProfilePath(profileUrl)}/fields/${encodeURIComponent(fieldName)}`;
  }

  function getBackendExperiencesPath(profileUrl) {
    return `${getBackendProfilePath(profileUrl)}/experiences`;
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
      } catch (_err) {
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

  function syncSelectionToBackend(profileUrl, fieldName, value) {
    (async () => {
      try {
        const result =
          fieldName === experienceFieldLabel
            ? await backendRequest(getBackendExperiencesPath(profileUrl), {
                method: 'POST',
                body: JSON.stringify({ value }),
              })
            : await backendRequest(getBackendFieldPath(profileUrl, fieldName), {
                method: 'PUT',
                body: JSON.stringify({ value }),
              });

        if (!result.ok) {
          setBackendStatus(`hiba (${result.status})`);
          return;
        }

        setBackendStatus('kapcsolodva');
      } catch (error) {
        console.error('Backend sync failed:', error);
        setBackendStatus('nem elerheto');
      }
    })();
  }

  async function pushProfileToBackend(profileUrl, profileData) {
    const scalarFields = fieldLabels.filter((label) => label !== experienceFieldLabel);

    for (const fieldName of scalarFields) {
      const value = profileData[fieldName];
      if (typeof value !== 'string' || value.trim() === '') {
        continue;
      }

      const result = await backendRequest(getBackendFieldPath(profileUrl, fieldName), {
        method: 'PUT',
        body: JSON.stringify({ value: value.trim() }),
      });

      if (!result.ok) {
        return { ok: false, status: result.status };
      }
    }

    const clearResult = await backendRequest(getBackendExperiencesPath(profileUrl), {
      method: 'DELETE',
    });

    if (!clearResult.ok && clearResult.status !== 404) {
      return { ok: false, status: clearResult.status };
    }

    const experiences = Array.isArray(profileData[experienceStorageKey])
      ? profileData[experienceStorageKey]
      : [];

    for (const experience of experiences) {
      if (typeof experience !== 'string' || experience.trim() === '') {
        continue;
      }

      const result = await backendRequest(getBackendExperiencesPath(profileUrl), {
        method: 'POST',
        body: JSON.stringify({ value: experience.trim() }),
      });

      if (!result.ok) {
        return { ok: false, status: result.status };
      }
    }

    return { ok: true, status: 200 };
  }

  function syncCurrentProfileFromBackend() {
    (async () => {
      try {
        const result = await backendRequest('/profiles', {
          method: 'GET',
        });

        if (!result.ok || !result.data || typeof result.data !== 'object') {
          setStatus('Backend letoltes sikertelen');
          setBackendStatus(`hiba (${result.status})`);
          return;
        }

        const backendData = result.data;
        const profileCount = Object.keys(backendData).filter((key) => isProfileStorageKey(key)).length;

        replaceStorageWithProfiles(backendData, `Teljes backend letoltve (${profileCount} profil)`);
        setBackendStatus('kapcsolodva');
      } catch (error) {
        console.error('Backend full fetch failed:', error);
        setStatus('Backend eleres sikertelen');
        setBackendStatus('nem elerheto');
      }
    })();
  }

  function syncCurrentProfileToBackend() {
    safeStorageGet(null, (storedData) => {
      (async () => {
        try {
          const localEntries = Object.entries(storedData).filter((entry) => {
            const [profileUrl, profileData] = entry;
            return (
              typeof profileUrl === 'string' &&
              (profileUrl.startsWith('http://') || profileUrl.startsWith('https://')) &&
              !!profileData &&
              typeof profileData === 'object' &&
              !Array.isArray(profileData)
            );
          });

          const backendProfilesResult = await backendRequest('/profiles', {
            method: 'GET',
          });

          if (!backendProfilesResult.ok || typeof backendProfilesResult.data !== 'object') {
            setStatus(`Backend push hiba (${backendProfilesResult.status})`);
            setBackendStatus(`hiba (${backendProfilesResult.status})`);
            return;
          }

          const backendProfileUrls = Object.keys(backendProfilesResult.data || {});
          for (const profileUrl of backendProfileUrls) {
            const result = await backendRequest(getBackendProfilePath(profileUrl), {
              method: 'DELETE',
            });

            if (!result.ok && result.status !== 404) {
              setStatus(`Backend torles hiba (${result.status})`);
              setBackendStatus(`hiba (${result.status})`);
              return;
            }
          }

          for (const [profileUrl, profileData] of localEntries) {
            const pushResult = await pushProfileToBackend(profileUrl, profileData);
            if (!pushResult.ok) {
              setStatus(`Backend push hiba (${pushResult.status})`);
              setBackendStatus(`hiba (${pushResult.status})`);
              return;
            }
          }

          setStatus(`Teljes local feltoltve backendbe (${localEntries.length} profil)`);
          setBackendStatus('kapcsolodva');
        } catch (error) {
          console.error('Backend full push failed:', error);
          setStatus('Backend push sikertelen');
          setBackendStatus('nem elerheto');
        }
      })();
    });
  }

  function checkBackendConnection() {
    (async () => {
      try {
        const result = await backendRequest('/actuator/health', { method: 'GET' });
        if (result.ok && result.data && result.data.status === 'UP') {
          setBackendStatus('elerheto');
          return;
        }

        setBackendStatus('nem valaszol');
      } catch (_error) {
        setBackendStatus('nem elerheto');
      }
    })();
  }

  function saveSelection(fieldName, value) {
    const profileUrl = getStorageProfileUrl();

    safeStorageGet([profileUrl], (result) => {
      const existingProfileData = result[profileUrl] || {};
      const updatedProfileDataBase =
        fieldName === experienceFieldLabel
          ? {
              ...existingProfileData,
              [experienceStorageKey]: [
                ...(Array.isArray(existingProfileData[experienceStorageKey])
                  ? existingProfileData[experienceStorageKey]
                  : []),
                value,
              ],
            }
          : {
              ...existingProfileData,
              [fieldName]: value,
            };
      const updatedProfileData = {
        ...updatedProfileDataBase,
        [profileLastUpdatedKey]: new Date().toISOString(),
      };

      safeStorageSet({ [profileUrl]: updatedProfileData }, () => {
        console.log('Saved profile data:', {
          [profileUrl]: updatedProfileData,
        });
        setStatus(
          fieldName === experienceFieldLabel ? 'Tapasztalat hozzaadva' : `${fieldName} elmentve`
        );
        setLastUpdatedDisplay(updatedProfileData[profileLastUpdatedKey]);
        syncSelectionToBackend(profileUrl, fieldName, value);
        if (fieldName === experienceFieldLabel) {
          const experienceCount = Array.isArray(updatedProfileData[experienceStorageKey])
            ? updatedProfileData[experienceStorageKey].length
            : 0;
          markButtonAsSaved(fieldName, experienceCount > 0, experienceCount);
          return;
        }
        markButtonAsSaved(fieldName, true);
      });
    });
  }

  function exportStorageAsJson() {
    chrome.storage.local.get(null, (storedData) => {
      if (chrome.runtime.lastError) {
        console.error('Storage export failed:', chrome.runtime.lastError.message);
        setStatus('Export sikertelen');
        return;
      }

      const json = JSON.stringify(storedData, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const timestamp = new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-');

      link.href = downloadUrl;
      link.download = `linkedin-profiles-${timestamp}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(downloadUrl);

      console.log('Exported storage data:', storedData);
      setStatus('JSON export kesz');
    });
  }

  function replaceStorageData(parsedData) {
    replaceStorageWithProfiles(parsedData, 'JSON import kesz');
    console.log('Imported storage data:', parsedData);
  }

  function normalizeImportedStorage(parsedData) {
    if (!parsedData || typeof parsedData !== 'object' || Array.isArray(parsedData)) {
      return {};
    }

    const normalized = { ...parsedData };
    const importedBackendUrl = normalizeBackendBaseUrl(parsedData[backendBaseUrlStorageKey]);

    if (importedBackendUrl) {
      normalized[backendBaseUrlStorageKey] = importedBackendUrl;
      backendBaseUrl = importedBackendUrl;
      backendUrlInput.value = importedBackendUrl;
    } else {
      delete normalized[backendBaseUrlStorageKey];
    }

    return normalized;
  }

  function importStorageFromJson(file) {
    file
      .text()
      .then((text) => {
        const parsedData = JSON.parse(text);
        const normalizedData = normalizeImportedStorage(parsedData);
        replaceStorageData(normalizedData);
      })
      .catch((error) => {
        console.error('JSON import failed:', error);
        setStatus('Import sikertelen');
      });
  }

  function createButton(label, clickHandler) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.style.border = 'none';
    button.style.borderRadius = '8px';
    button.style.padding = '8px 14px';
    button.style.background = '#e2e8f0';
    button.style.color = '#0f172a';
    button.style.fontSize = '13px';
    button.style.fontWeight = '600';
    button.style.whiteSpace = 'nowrap';
    button.style.width = '100%';
    button.style.cursor = 'pointer';
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (clickHandler) {
        clickHandler();
        return;
      }

      startSelectionMode(label);
    });
    return button;
  }

  function createExportButton() {
    return createButton('Export JSON', exportStorageAsJson);
  }

  function createImportButton() {
    return createButton('Import JSON', () => {
      importInput.value = '';
      importInput.click();
    });
  }

  function createBackendPullButton() {
    return createButton('Sync From Backend', syncCurrentProfileFromBackend);
  }

  function createBackendPushButton() {
    return createButton('Sync To Backend', syncCurrentProfileToBackend);
  }

  backendUrlSaveButton.addEventListener('click', () => {
    saveBackendBaseUrlFromInput();
  });

  backendUrlInput.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    saveBackendBaseUrlFromInput();
  });

    const buttonMap = {};
    const buttonStateMap = {};

    function renderButtonLabel(fieldName) {
      const btn = buttonMap[fieldName];
      const state = buttonStateMap[fieldName];
      if (!btn || !state) {
        return;
      }

      const hotkeyPrefix = hotkeyHintsVisible ? `${fieldHotkeyMap[fieldName]} ` : '';

      if (state.saved) {
        if (fieldName === experienceFieldLabel) {
          const safeCount = Number.isInteger(state.count) && state.count > 0 ? state.count : 0;
          btn.textContent = `${hotkeyPrefix}✓ ${fieldName} (${safeCount})`;
          return;
        }
        btn.textContent = `${hotkeyPrefix}✓ ${fieldName}`;
        return;
      }

      btn.textContent = `${hotkeyPrefix}${fieldName}`;
    }

    function setHotkeyHintsVisible(visible) {
      if (hotkeyHintsVisible === visible) {
        return;
      }

      hotkeyHintsVisible = visible;
      fieldLabels.forEach((label) => {
        renderButtonLabel(label);
      });
    }

    function markButtonAsSaved(fieldName, saved, count) {
      const btn = buttonMap[fieldName];
      if (!btn) {
        return;
      }
      buttonStateMap[fieldName] = {
        saved,
        count: Number.isInteger(count) ? count : 0,
      };
      if (saved) {
        btn.style.background = '#bbf7d0';
        btn.style.color = '#14532d';
      } else {
        btn.style.background = '#e2e8f0';
        btn.style.color = '#0f172a';
      }
      renderButtonLabel(fieldName);
    }

    function refreshButtonStates() {
      if (!isExtensionContextValid()) {
        handleInvalidExtensionContext();
        return;
      }

      const profileUrl = getStorageProfileUrl();
      safeStorageGet([profileUrl], (result) => {
        const data = result[profileUrl] || {};
        fieldLabels.forEach((label) => {
          const storageKey = label === experienceFieldLabel ? experienceStorageKey : label;
          const value = data[storageKey];
          const experienceCount = Array.isArray(data[experienceStorageKey])
            ? data[experienceStorageKey].length
            : 0;
          const hasSavedData =
            label === experienceFieldLabel
              ? experienceCount > 0
              : value !== undefined && value !== null && value !== '';
          markButtonAsSaved(label, hasSavedData, experienceCount);
        });
        setLastUpdatedDisplay(data[profileLastUpdatedKey]);
      });
    }

    function refreshPanelForCurrentProfile(force) {
      if (!isExtensionContextValid()) {
        handleInvalidExtensionContext();
        return;
      }

      const profileUrl = getStorageProfileUrl();
      if (!force && profileUrl === lastSyncedProfileUrl) {
        return;
      }

      lastSyncedProfileUrl = profileUrl;
      refreshButtonStates();
    }

    fieldLabels.forEach((label) => {
      const btn = createButton(label);
      buttonMap[label] = btn;
      buttonStateMap[label] = {
        saved: false,
        count: 0,
      };
      panel.appendChild(btn);
    });

  panel.appendChild(createExportButton());
  panel.appendChild(createImportButton());
  panel.appendChild(createBackendPullButton());
  panel.appendChild(createBackendPushButton());

  document.body.appendChild(panel);
  document.body.appendChild(importInput);

  importInput.addEventListener('change', () => {
    const [file] = importInput.files || [];
    if (!file) {
      return;
    }

    importStorageFromJson(file);
  });

    runOneTimeStorageCleanup(() => {
      loadBackendBaseUrlConfig(() => {
        refreshPanelForCurrentProfile(true);
        checkBackendConnection();
      });
    });

  if (supportsPopover()) {
    panel.setAttribute('popover', 'manual');
    panel.style.inset = '120px 16px auto auto';
    panel.style.top = '120px';
    panel.style.left = 'auto';
    panel.style.right = '16px';
    panel.style.transform = 'none';
    promotePanelToFront();
  }

  const overlayObserver = new MutationObserver((mutations) => {
    const shouldPromote = mutations.some((mutation) => {
      if (mutation.type === 'attributes') {
        return mutation.target instanceof HTMLElement;
      }

      return mutation.addedNodes.length > 0;
    });

    if (shouldPromote) {
      schedulePanelPromotion();
      refreshPanelForCurrentProfile(false);
    }
  });

  overlayObserver.observe(document.documentElement, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['open', 'popover'],
  });

  document.addEventListener(
    'mouseover',
    (event) => {
      if (!activeField) {
        return;
      }

      const target = event.target;
      if (!(target instanceof HTMLElement) || panel.contains(target)) {
        return;
      }

      if (hoveredElement && hoveredElement !== target) {
        hoveredElement.classList.remove('floating-selector-hover');
      }

      hoveredElement = target;
      hoveredElement.classList.add('floating-selector-hover');
    },
    true
  );

  document.addEventListener(
    'click',
    (event) => {
      if (!activeField) {
        return;
      }

      const target = event.target;
      if (!(target instanceof HTMLElement) || panel.contains(target)) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const selectedText = target.innerText.trim();
      console.log(`[${activeField}]`, selectedText);
      saveSelection(activeField, selectedText);

      stopSelectionMode();
    },
    true
  );

  function handleKeydown(event) {
    setHotkeyHintsVisible(event.ctrlKey && event.altKey);

    if (event.ctrlKey && event.altKey) {
      const selectedField = fieldKeyMap[event.code];

      if (selectedField) {
        event.preventDefault();
        event.stopPropagation();
        startSelectionMode(selectedField);
        schedulePanelPromotion();
        return;
      }

      if (event.code === 'Digit0') {
        event.preventDefault();
        event.stopPropagation();
        schedulePanelPromotion();
        return;
      }
    }

    if (event.key === 'Escape' && activeField) {
      stopSelectionMode();
    }
  }

  function handleKeyup(event) {
    setHotkeyHintsVisible(event.ctrlKey && event.altKey);
  }

  globalThis.addEventListener('keydown', handleKeydown, true);
  globalThis.addEventListener('keyup', handleKeyup, true);
  globalThis.addEventListener('blur', () => setHotkeyHintsVisible(false));
  globalThis.addEventListener('popstate', () => refreshPanelForCurrentProfile(true));
  globalThis.addEventListener('focus', () => refreshPanelForCurrentProfile(true));
  profileRefreshIntervalId = globalThis.setInterval(() => refreshPanelForCurrentProfile(false), 700);
})();