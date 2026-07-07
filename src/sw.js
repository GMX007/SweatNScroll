import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { clientsClaim } from 'workbox-core';

// Force the new service worker to activate immediately (no waiting for tabs to close)
self.skipWaiting();
clientsClaim();

// Workbox injects the precache manifest here at build time
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// ── Runtime caching (replaces the workbox config from vite.config.js) ──

registerRoute(
  ({ url }) => url.origin === 'https://cdn.jsdelivr.net',
  new CacheFirst({
    cacheName: 'tensorflow-models',
    plugins: [new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 30 })],
  })
);

registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com',
  new StaleWhileRevalidate({ cacheName: 'google-fonts-stylesheets' })
);

registerRoute(
  ({ url }) => url.origin === 'https://fonts.gstatic.com',
  new CacheFirst({
    cacheName: 'google-fonts-webfonts',
    plugins: [new ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 })],
  })
);

// ── Scroll Timer Notification ──
// When the user starts their scroll session, the app sends a message with
// the end time. The service worker schedules a notification to fire then,
// so the user gets alerted even if they've fully left the app.

let notificationTimer = null;

self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'SCHEDULE_SCROLL_NOTIFICATION') {
    const { endTime } = event.data;
    if (typeof endTime !== 'number' || !Number.isFinite(endTime)) return;

    const delay = Math.max(0, endTime - Date.now());

    // Clear any existing timer
    if (notificationTimer) clearTimeout(notificationTimer);

    notificationTimer = setTimeout(() => {
      notificationTimer = null;
      try {
        self.registration.showNotification("Time's up! ⏰ Back to work!", {
          body: "Your scroll time just ran out. Come back and sweat for more! 💪",
          icon: '/favicon.png',
          tag: 'scroll-timer',
          renotify: true,
          requireInteraction: true,
          vibrate: [200, 100, 200],
          data: { url: '/' },
        });
      } catch (e) {
        console.error('[FormForged SW] showNotification failed:', e);
      }
    }, delay);
  }

  if (event.data.type === 'CANCEL_SCROLL_NOTIFICATION') {
    if (notificationTimer) {
      clearTimeout(notificationTimer);
      notificationTimer = null;
    }
    // Also close any visible notification
    self.registration.getNotifications({ tag: 'scroll-timer' })
      .then(notifications => notifications.forEach(n => n.close()));
  }
});

// Open the app when user taps the notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      // Focus existing window if open
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
