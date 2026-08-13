# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Auto OAuth is a Chrome Extension (Manifest V3) that automatically selects the user's preferred Google or Microsoft account on OAuth login pages. Users configure a preferred identity per site, and the extension auto-redirects on future visits.

**Version**: 1.2.1
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
  → background.js (service worker) detects URL via webNavigation.onCompleted listener
  → If preference exists: auto-redirect with login_hint param + show spinner
  → If no preference: enable action icon; user clicks to open menu popup
    → script.js (content script) extracts available accounts from the page DOM
    → User selects account → saved to Chrome sync storage → redirect
```

### Key Files

| File | Role |
|------|------|
| `manifest.json` | Extension manifest (V3), defines permissions, host_permissions, URL patterns, service worker |
| `src/background.js` | Service worker. Listens for OAuth navigations, stores host→tab mapping in session storage, reads preferences from sync storage, triggers redirects |
| `src/script.js` | Content script injected into OAuth pages. Extracts available accounts from DOM elements |
| `src/menu.js` | Popup menu logic. Reads host from session storage, injects script via `chrome.scripting`, user selects account |
| `src/options.js` | Settings page for managing saved host→email mappings, import/export |
| `src/show_menu.js` | Injects menu as iframe for popup window OAuth flows |
| `src/prefill.js` | Pre-fills Microsoft login field when `domain_hint` URL param is present |
| `src/redirecting.js` | Shows spinner overlay during auto-login redirect |
| `src/pako.js` | Vendored compression library for decompressing SAML requests (loaded via `importScripts`) |

### Data Model

Chrome sync storage holds a flat map of `{ hostname: email }` pairs (e.g., `{"example.com": "user@gmail.com"}`). This syncs across the user's Chrome instances.

Chrome session storage holds `{ tabId: hostname }` pairs to track which OAuth host each tab is visiting. This survives service worker restarts but is cleared when the browser closes.

### Message Passing

Content scripts and background communicate via `chrome.runtime.sendMessage()`:
- `addAuto` — content script tells background to save a preference and redirect

The popup (`menu.js`) reads the host directly from `chrome.storage.session` — no message round-trip needed.

### URL Parsing

- **Google OAuth**: Extracts `redirect_uri` param → parses hostname (handles `storagerelay://` protocol)
- **Microsoft SAML**: Extracts `SAMLRequest` param → base64-decodes → pako inflateRaw → regex extracts `saml:Issuer` hostname
- **Google Identity Services popups**: send `redirect_uri=gis_transform`, which is a marker
  rather than a URL. When neither of the above yields a host, fall back to the `origin` /
  `app_domain` params, which carry the site being logged into.
- All URLs are run through `decodeURI()` to handle encoded redirects
- Every host parse is failure-tolerant. A URL that cannot be parsed must return `null`, not
  throw — the parsers run inside the `webNavigation.onCompleted` listener, and an exception
  there aborts the whole handler, so the tab never gets its host recorded in session storage
  and the popup menu silently comes up empty.

## Choosing the account

Two mechanisms, picked by URL:

- **Classic endpoints** (`/o/oauth2/`, Microsoft): re-navigate the tab with `login_hint`
  appended and `prompt` stripped.
- **Google v3** (`/v3/signin/`): the chooser ignores `login_hint`, and a GIS popup's
  `redirect_uri` is not a real URL, so there is no OAuth request to rebuild. Instead
  `clickAccount()` is injected into the page (via `chrome.scripting.executeScript` with
  `func`/`args`) and clicks the matching account row, polling briefly because the list
  renders after `onCompleted` fires. It only ever clicks a list item that wraps a link,
  so a password or challenge page displaying the address is left alone, and it clears the
  `#auto-oauth-spinner` overlay if nothing matches rather than leaving it spinning.

## Notes

- `pako.js` is vendored (not from npm) — update manually if needed.
- The service worker uses `importScripts('pako.js')` to load the vendored library.
- `chrome.storage.session` requires `setAccessLevel()` to be accessible from non-background contexts (popup).
