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

  const highlightStyle = document.createElement('style');
  highlightStyle.textContent = `
    .floating-selector-hover {
      outline: 2px solid #22c55e !important;
      cursor: crosshair !important;
    }
  `;
  document.documentElement.appendChild(highlightStyle);

  let activeField = null;
  let hoveredElement = null;
  let promoteTimer = null;
  const profileLastUpdatedKey = 'LastUpdatedAt';
  const experienceFieldLabel = 'Add Experience';
  const experienceStorageKey = 'Experiences';
  const fieldLabels = [
    'Name',
    'Headline',
    'Info',
    'Location',
    'NumOfContacts',
    'Contact',
    experienceFieldLabel,
  ];
  const fieldKeyMap = {
    Digit1: 'Name',
    Digit2: 'Headline',
    Digit3: 'Info',
    Digit4: 'Location',
    Digit5: 'NumOfContacts',
    Digit6: 'Contact',
    Digit7: experienceFieldLabel,
  };

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

    if (url.pathname.endsWith('/overlay/contact-info/')) {
      url.pathname = url.pathname.replace(/\/overlay\/contact-info\/$/, '/');
      url.search = '';
      url.hash = '';
    }

    return url.toString();
  }

  function saveSelection(fieldName, value) {
    const profileUrl = getStorageProfileUrl();

    chrome.storage.local.get([profileUrl], (result) => {
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

      chrome.storage.local.set({ [profileUrl]: updatedProfileData }, () => {
        if (chrome.runtime.lastError) {
          console.error('Storage save failed:', chrome.runtime.lastError.message);
          setStatus('Mentés sikertelen');
          return;
        }

        console.log('Saved profile data:', {
          [profileUrl]: updatedProfileData,
        });
        setStatus(
          fieldName === experienceFieldLabel ? 'Tapasztalat hozzaadva' : `${fieldName} elmentve`
        );
        setLastUpdatedDisplay(updatedProfileData[profileLastUpdatedKey]);
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

    const buttonMap = {};

    function markButtonAsSaved(fieldName, saved, count) {
      const btn = buttonMap[fieldName];
      if (!btn) {
        return;
      }
      if (saved) {
        btn.style.background = '#bbf7d0';
        btn.style.color = '#14532d';
        if (fieldName === experienceFieldLabel) {
          const safeCount = Number.isInteger(count) && count > 0 ? count : 0;
          btn.textContent = `✓ ${fieldName} (${safeCount})`;
          return;
        }
        btn.textContent = `✓ ${fieldName}`;
      } else {
        btn.style.background = '#e2e8f0';
        btn.style.color = '#0f172a';
        btn.textContent = fieldName;
      }
    }

    function refreshButtonStates() {
      const profileUrl = getStorageProfileUrl();
      chrome.storage.local.get([profileUrl], (result) => {
        if (chrome.runtime.lastError) {
          return;
        }
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

    fieldLabels.forEach((label) => {
      const btn = createButton(label);
      buttonMap[label] = btn;
      panel.appendChild(btn);
    });

  panel.appendChild(createExportButton());

  document.body.appendChild(panel);

    refreshButtonStates();

  if (supportsPopover()) {
    panel.setAttribute('popover', 'manual');
    panel.style.inset = '120px 16px auto auto';
    panel.style.top = '120px';
    panel.style.left = 'auto';
    panel.style.right = 'auto';
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

  globalThis.addEventListener('keydown', handleKeydown, true);
})();