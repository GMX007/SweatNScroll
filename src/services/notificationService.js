/**
 * FormForge Notification Service
 * Manages permission requests and scroll timer notifications via the service worker.
 */

/**
 * Request notification permission.
 * Returns true if granted.
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;

  const result = await Notification.requestPermission();
  return result === 'granted';
}

/**
 * Post to whichever worker is available (active first; installing during first visit).
 */
function postToServiceWorker(reg, data) {
  const worker = reg.active || reg.waiting || reg.installing;
  if (worker) {
    worker.postMessage(data);
    return true;
  }
  return false;
}

/**
 * Schedule a notification via the service worker when scroll time expires.
 * Survives tab backgrounding; SW uses setTimeout to call showNotification at endTime.
 * @param {number} endTime - Unix ms timestamp when scrolling ends
 */
export async function scheduleScrollEndNotification(endTime) {
  if (!('serviceWorker' in navigator)) return;
  if (typeof endTime !== 'number' || !Number.isFinite(endTime)) return;

  const permitted = await requestNotificationPermission();
  if (!permitted) return;

  const payload = { type: 'SCHEDULE_SCROLL_NOTIFICATION', endTime };

  try {
    const reg = await navigator.serviceWorker.ready;
    if (postToServiceWorker(reg, payload)) return;

    // Rare: ready resolved but no worker handle yet — retry briefly (mobile first paint).
    for (let i = 0; i < 15; i += 1) {
      await new Promise((r) => setTimeout(r, 200));
      if (postToServiceWorker(reg, payload)) return;
      const again = await navigator.serviceWorker.getRegistration();
      if (again && postToServiceWorker(again, payload)) return;
    }
  } catch {
    /* ignore */
  }
}

/**
 * Cancel the scroll end notification (e.g., session ended in-app).
 */
export function cancelScrollEndNotification() {
  if (!('serviceWorker' in navigator)) return;
  const payload = { type: 'CANCEL_SCROLL_NOTIFICATION' };
  navigator.serviceWorker.ready
    .then((reg) => {
      postToServiceWorker(reg, payload);
    })
    .catch(() => {});
}

/** Buzz when scroll time ends (foreground / tab visible). No-op if unsupported. */
export function vibrateScrollTimeUp() {
  if (typeof navigator === 'undefined' || !navigator.vibrate) return;
  try {
    navigator.vibrate([200, 100, 200, 100, 400]);
  } catch {
    /* ignore */
  }
}

/**
 * When the tab is visible, some phones handle this better than window.alert().
 * Uses the same tag as the SW notification so duplicates replace instead of stack.
 */
export function showScrollTimeUpPageNotification() {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
  if (typeof document !== 'undefined' && document.hidden) return;
  try {
    new Notification("Time's up! ⏰", {
      body: 'Your scroll session ended. Open FormForge to earn more.',
      tag: 'scroll-timer',
      requireInteraction: true,
    });
  } catch {
    /* ignore */
  }
}
