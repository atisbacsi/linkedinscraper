# LinkedIn Handy Scraper Panel

This project is a lightweight Chrome Extension based on Manifest V3. It injects a small floating panel into LinkedIn profile pages and lets you capture page content by selecting elements directly in the DOM.

Selected values are stored in `chrome.storage.local`, grouped by profile URL, and can be exported to or imported from JSON.

## Features

- Active only on LinkedIn profile URLs (`https://linkedin.com/in/*` and `https://www.linkedin.com/in/*`)
- Right-side floating control panel
- Click-to-select extraction from LinkedIn profile pages
- Keyboard shortcuts for fast field selection
- Visual selection highlight for hovered elements
- Per-profile storage in `chrome.storage.local`
- Contact overlay URL normalization
- `Experiences` stored as an array
- Last updated timestamp stored per profile
- Saved-state indicators on field buttons
- Full JSON export
- Full JSON import that replaces existing storage content
- Automatic backend sync on field save
- Manual full-collection sync buttons (pull from backend / push to backend)

## Captured Fields

The extension currently supports these fields:

- `Name`
- `Headline`
- `Location`
- `NumOfContacts`
- `Contact`
- `Info`
- `Add Experience` → appended to the `Experiences` array

## How It Works

1. Open a LinkedIn profile page.
2. Click a field button in the floating panel, or use the matching keyboard shortcut.
3. The extension enters selection mode.
4. Click an element on the page.
5. The selected element's `innerText` is saved for the current profile.

The panel also shows:

- current status
- last update timestamp for the active profile
- checkmarks for fields that already have saved data
- experience count for the `Add Experience` button

## URL Normalization

When data is captured from LinkedIn's contact overlay view, the value is stored under the base profile URL instead of the overlay URL.

Example:

- source page: `https://www.linkedin.com/in/example/overlay/contact-info/`
- storage key: `https://www.linkedin.com/in/example/`

## Keyboard Shortcuts

The extension supports these shortcuts:

- `Ctrl + Alt + 1` → `Name`
- `Ctrl + Alt + 2` → `Headline`
- `Ctrl + Alt + 3` → `Location`
- `Ctrl + Alt + 4` → `NumOfContacts`
- `Ctrl + Alt + 5` → `Contact`
- `Ctrl + Alt + 6` → `Info`
- `Ctrl + Alt + 7` → `Add Experience`
- `Ctrl + Alt + 0` → bring the panel to the front
- `Escape` → exit selection mode

On macOS, `Alt` corresponds to the `Option` key.

## Data Format

Saved data is stored in `chrome.storage.local` as an object keyed by profile URL.

Example:

```json
{
  "https://www.linkedin.com/in/example/": {
    "Name": "Example Name",
    "Headline": "Software Engineer",
    "Location": "Berlin, Germany",
    "NumOfContacts": "500+",
    "Contact": "example@example.com",
    "Info": "Open to work",
    "Experiences": [
      "Experience block 1",
      "Experience block 2"
    ],
    "LastUpdatedAt": "2026-04-30T09:30:00.000Z"
  }
}
```

## JSON Export And Import

The panel includes two storage utility buttons:

- `Export JSON` downloads the full contents of `chrome.storage.local` as a `.json` file.
- `Import JSON` opens a file picker, clears the existing local storage, and replaces it with the contents of the selected JSON file.

The panel also includes backend sync buttons:

- `Sync From Backend` pulls the full backend dataset (`/profiles`) and replaces `chrome.storage.local`.
- `Sync To Backend` pushes the full local dataset to the backend (export/import-like full replace).

The import is intentionally simple:

- no schema validation
- no merge logic
- existing storage is fully replaced

## Backend Connection

Default backend URL is `http://localhost:8080`, but it is configurable directly in the panel UI (`Backend URL` input + `Save` button).

After saving a new URL, the extension stores it in `chrome.storage.local` and uses it for all backend operations (health check, sync pull/push, auto-save sync).

The extension requires host permissions for:

- `http://*/*`
- `https://*/*`

For profile URL path parameters, the current backend contract uses double URL-encoding.

## Installation

1. Open Chrome.
2. Go to `chrome://extensions/`.
3. Enable `Developer mode`.
4. Click `Load unpacked`.
5. Select the `apps/extension` folder.

## Project Structure

- `apps/extension/manifest.json` → extension manifest and LinkedIn URL matching
- `apps/extension/content.js` → injected panel UI, selection flow, storage handling, import/export, hotkeys
- `apps/extension/README.md` → extension documentation

## Notes

- The extension does not use a background service worker.
- The UI is injected directly by the content script.
- Some LinkedIn overlays can affect click interaction, so keyboard shortcuts are supported as a fallback.
- Imported data is written directly to `chrome.storage.local`, so use the import feature carefully.