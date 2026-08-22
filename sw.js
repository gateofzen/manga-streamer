// Minimal Service Worker for Manga Streamer PWA installability.
//
// Chrome requires a registered Service Worker with a fetch handler in
// order to show the "Install app" prompt. This SW is intentionally
// pass-through — it does NOT cache anything, because:
//
//   1. The app is one giant index.html and re-fetches Drive content
//      via authenticated API calls. Caching those would leak private
//      manga bytes across sessions.
//   2. Stale caches were the source of several confusing bugs during
//      development. Keeping this SW dumb avoids that class of problem.
//
// If you want offline support later, add a cache-first strategy here
// for the app shell only (index.html + icons + manifest).

const VERSION = 'v1-2026-08-22';

self.addEventListener('install', (event) => {
  // Activate the new SW immediately so users don't need to close/reopen
  // the app to pick up an updated version.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Claim all clients so this SW starts handling their fetches right away.
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pure pass-through — required for Chrome to consider the app installable,
  // but no cache logic so the app always talks to the live server/API.
  // event.respondWith is omitted; the browser handles the fetch normally.
});
