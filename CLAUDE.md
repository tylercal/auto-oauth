# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Auto OAuth is a Chrome Extension (Manifest V2) that automatically selects the user's preferred Google or Microsoft account on OAuth login pages. Users configure a preferred identity per site, and the extension auto-redirects on future visits.

**Version**: 1.1.1
**License**: AGPL-3.0
**Language**: Vanilla JavaScript (no frameworks, no build system, no npm)

## Development

No build step required. Load the extension directly in Chrome:

1. Navigate to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select this repository directory
4. Reload the extension after making changes

There are no tests, linter, or CI configured. Testing is manual via OAuth login flows.

## Architecture

### Flow

```
User clicks "Login with Google/Microsoft" on a website
  → Browser navigates to OAuth endpoint
  → background.js detects URL via webNavigation.onCompleted listener
  → If preference exists: auto-redirect with login_hint param + show spinner
  → If no preference: show page action icon; user clicks to open menu popup
    → script.js (content script) extracts available accounts from the page DOM
    → User selects account → saved to Chrome sync storage → redirect
```

### Key Files

| File | Role |
|------|------|
| `manifest.json` | Extension manifest (V2), defines permissions, URL patterns, background scripts |
| `src/background.js` | Main orchestrator. Listens for OAuth navigations, manages host→email mappings in memory, triggers redirects |
| `src/script.js` | Content script injected into OAuth pages. Extracts available accounts from DOM elements |
| `src/menu.js` | Popup menu logic. 4-step flow: get tab → get host → inject script → user selects account |
| `src/options.js` | Settings page for managing saved host→email mappings, import/export |
| `src/show_menu.js` | Injects menu as iframe for popup window OAuth flows |
| `src/prefill.js` | Pre-fills Microsoft login field when `domain_hint` URL param is present |
| `src/redirecting.js` | Shows spinner overlay during auto-login redirect |
| `src/pako.js` | Vendored compression library for decompressing SAML requests |

### Data Model

Chrome sync storage holds a flat map of `{ hostname: email }` pairs (e.g., `{"example.com": "user@gmail.com"}`). This syncs across the user's Chrome instances.

In-memory state in `background.js`:
- `hostMap`: `{ tabId: hostname }` — tracks which OAuth host each tab is visiting
- `autoLogins`: mirror of Chrome sync storage, refreshed on changes

### Message Passing

Content scripts and background communicate via `chrome.runtime.sendMessage()`:
- `addAuto` — content script tells background to save a preference and redirect
- `hostForTabId` / `requestedHost` — popup requests the parsed host for its tab

### URL Parsing

- **Google OAuth**: Extracts `redirect_uri` param → parses hostname (handles `storagerelay://` protocol)
- **Microsoft SAML**: Extracts `SAMLRequest` param → base64-decodes → pako inflateRaw → parses XML → extracts `saml:Issuer` hostname
- All URLs are run through `decodeURI()` to handle encoded redirects

## Notes

- This is Manifest V2, which Chrome is deprecating. Migration to Manifest V3 will eventually be needed (service workers instead of background pages, different content script injection APIs, etc.).
- The `page_action` API (used for the toolbar icon) is replaced by `action` in V3.
- `pako.js` is vendored (not from npm) — update manually if needed.
