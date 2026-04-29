# LinkedIn Scrape Plugin

This project is a simple Chrome Extension Manifest V3 content-script tool for collecting structured data from LinkedIn profile pages.

It injects a small control panel on the right side of LinkedIn pages. From there, you can activate a selection mode, click specific elements on the page, and save their `innerText` values into `chrome.storage.local`.

## Features

- Runs only on `linkedin.com`
- Right-side floating control panel
- Click-to-select data extraction from LinkedIn profile pages
- Storage in `chrome.storage.local`, grouped by profile URL
- Contact overlay URL normalization
- Keyboard shortcuts for quick field selection
- Experience entries stored as an array
- Full storage export as a JSON file

## Captured Fields

The extension currently supports these fields:

- `Name`
- `Headline`
- `Info`
- `Location`
- `Contact`
- `NumOfContacts`
- `Add Experience` → appended to an `Experiences` array

## How It Works

1. Open a LinkedIn profile page.
2. Click one of the buttons in the panel.
3. The extension enters selection mode.
4. Click an element on the page.
5. The selected element's `innerText` is saved under the current profile URL in `chrome.storage.local`.

For the LinkedIn contact overlay URL:

- `https://www.linkedin.com/in/example/overlay/contact-info/`

the extension stores the data under:

- `https://www.linkedin.com/in/example/`

## Keyboard Shortcuts

The extension also supports keyboard shortcuts:

- `Ctrl + Alt + 1` → `Name`
- `Ctrl + Alt + 2` → `Headline`
- `Ctrl + Alt + 3` → `Info`
- `Ctrl + Alt + 4` → `Location`
- `Ctrl + Alt + 5` → `Contact`
- `Ctrl + Alt + 6` → `NumOfContacts`
- `Ctrl + Alt + 7` → `Add Experience`
- `Ctrl + Alt + 0` → bring the panel to the front
- `Escape` → exit selection mode

On macOS, `Alt` corresponds to the `Option` key.

## Data Format

Saved data is stored in `chrome.storage.local` as a JSON-like object keyed by profile URL.

Example:

```json
{
  "https://www.linkedin.com/in/example/": {
    "Name": "Example Name",
    "Headline": "Software Engineer",
    "Location": "Berlin, Germany",
    "Contact": "example@example.com",
    "NumOfContacts": "500+",
    "Experiences": [
      "Experience block 1",
      "Experience block 2"
    ]
  }
}
```

## JSON Export

The panel includes an `Export JSON` button.

When clicked, it exports the full contents of `chrome.storage.local` into a downloadable `.json` file.

## Installation

1. Open Chrome.
2. Go to `chrome://extensions/`.
3. Enable `Developer mode`.
4. Click `Load unpacked`.
5. Select this project folder.

## Project Structure

- `manifest.json` → Chrome Extension Manifest V3 configuration
- `content.js` → injected UI, selection logic, storage logic, export logic
- `README.md` → project documentation

## Notes

- This extension is intentionally lightweight and does not use a background service worker.
- The UI is injected directly by the content script.
- Some LinkedIn overlays can affect interaction patterns, so keyboard shortcuts are supported as a fallback.