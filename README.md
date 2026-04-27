# Manga Streamer Web

Browser-based manga streaming reader for ZIP/CBZ archives stored on Google Drive.
Single-file HTML — deploy to GitHub Pages, no build step.

## Features

- **HTTP Range streaming** of ZIP central directory + per-page entries (no full download)
- **DEFLATE / Stored** support via native `DecompressionStream('deflate-raw')`
- **ZIP64 + Shift_JIS / UTF-8** filename decoding
- **RTL paging** with scroll-snap (right tap = previous page)
- **Single page / two-page spread** view toggle (book-style with cover-alone convention)
- **Cross-device progress sync** via Drive `appDataFolder` (hidden per-app folder)
- **Drive-wide file search** by name
- LRU image cache (16 pages) + ±2 slot preload

Not supported: RAR/CBR, encrypted ZIPs.

## Quick start

1. Drop `index.html` somewhere (GitHub Pages, local file server, etc.)
2. Set up a Google OAuth Web Client ID (see below)
3. Open the page, paste the Client ID, sign in

## Google Cloud setup

If you already have an Android version of Manga Streamer set up, **reuse the same
project** — just add a Web Application Client ID alongside your existing Android one.

In Google Cloud Console:

1. Enable **Drive API**
2. **Google Auth Platform** → Branding/Audience: External, add yourself as Test user
3. **Google Auth Platform → Data Access** → add scopes:
   - `https://www.googleapis.com/auth/drive.readonly` (read manga files)
   - `https://www.googleapis.com/auth/drive.appdata` (cross-device progress sync)
4. **Google Auth Platform → Clients** → Create Client → Application type: **Web application**
   - **Authorized JavaScript origins**: the origin where you'll host the app
     (e.g. `https://gateofzen.github.io`, or `http://localhost:8080` for local dev)
   - SHA-1 fingerprint is **not** needed for Web clients
5. Copy the Client ID into the app's sign-in screen

> **Existing Android-version users**: the new `drive.appdata` scope means the
> consent screen will ask for permission to manage app-specific data on Drive.
> You'll need to approve once.

## How features work

### Single / spread view toggle

A button in the reader top bar (or **V** key) switches between:

- **Single**: one page per scroll snap
- **Spread**: book-style, cover alone followed by `[1,2], [3,4], ...` pairs.
  Within a spread, the lower-numbered page sits on the **right** (RTL convention).

The choice persists globally in `localStorage`. When toggling mid-read, the
current page is preserved (the new view scrolls to the slot containing it).

### Cross-device progress sync

Read progress is stored as a single JSON file `progress.json` inside Google
Drive's hidden **appDataFolder** (per-app, invisible in normal Drive UI).

```json
{
  "version": 1,
  "files": {
    "<driveFileId>": { "page": 42, "updated": 1714298400000 }
  }
}
```

- On sign-in: cloud progress is pulled, merged with any local data, and cached
  to localStorage as a mirror.
- Page changes: written to localStorage immediately; cloud write is debounced
  (3 s) and flushed when the reader closes.
- Returning to the browser tab (`visibilitychange`) auto-refreshes from cloud,
  so progress made on another device shows up in the file list.
- A small red dot next to the breadcrumb pulses while syncing.

To wipe cloud progress: delete `progress.json` from the Drive **App Data** view
in Google Drive's settings (Settings → Manage apps → Manga Streamer → Disconnect).

### Drive search

Click the magnifying glass in the top bar (or it's there always; toggle
swaps breadcrumb ↔ search input). Press Enter to query Drive globally with
`name contains '<term>'`. Results show ZIP/CBZ files first, then folders.

- Click a ZIP → opens in reader
- Click a folder → navigates into it (search context cleared)
- Esc / × → exits search, back to folder browsing

## Keyboard shortcuts (reader)

| Key | Action |
|---|---|
| ← | Next page (RTL) |
| → | Previous page |
| V | Toggle single / spread |
| Esc | Close reader |

## File layout

```
manga-streamer-web/
├── index.html   # everything (HTML + CSS + JS, ~1100 lines)
└── README.md
```

## Privacy

The Client ID, view mode preference, and a mirror of progress data are stored in
`localStorage`. Progress also lives in your own Drive's app data folder. Nothing
is sent anywhere except `googleapis.com`.
