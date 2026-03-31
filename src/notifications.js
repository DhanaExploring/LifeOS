// ── Notification Scheduler ────────────────────────────────────────────────────
// Schedules morning & evening notifications via the service worker.
// Uses three layers for reliability on mobile PWAs:
//   1. Periodic Background Sync — wakes the SW even when the app is closed (Chrome Android)
//   2. Foreground setTimeout — fires when the app tab is open
//   3. visibilitychange re-init — recalculates timers when returning from background

const MORNING_MESSAGES = [
  { title: "Good morning ☀", body: "Start your day with intention. Open LifeOS to set today's mood and affirmation." },
  { title: "Rise & shine ☯", body: "A new day is here. Check in with yourself — how are you feeling?" },
  { title: "Morning check-in 🌿", body: "Take a moment to set your intention and log today's gratitude." },
  { title: "New day, fresh start 🌅", body: "Your daily check-in is waiting. What are you grateful for today?" },
  { title: "Hello, beautiful day ✦", body: "Open LifeOS to pick your affirmation and plan your habits." },
];

const EVENING_MESSAGES = [
  { title: "Time to wind down 🌙", body: "Reflect on your day. Log your habits and brain dump before bed." },
  { title: "Evening check-in ☾", body: "How was today? Take a minute to close out your daily log." },
  { title: "Day's almost done 🌿", body: "Did you complete your habits? Open LifeOS to wrap up your day." },
  { title: "Goodnight ritual 🕯", body: "A quick brain dump before bed clears the mind. You earned this rest." },
  { title: "Wind-down time ☯", body: "Reflect, log, and let go. Tomorrow is a fresh page." },
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Milliseconds until next occurrence of a given hour:minute today or tomorrow
function msUntil(hour, minute = 0) {
  const now = new Date();
  const target = new Date(now);
  target.setHours(hour, minute, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 1);
  return target - now;
}

let morningTimer = null;
let eveningTimer = null;
let currentPrefs = null;

function sendViaServiceWorker(msg) {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.ready.then((reg) => {
    if (reg.active) reg.active.postMessage(msg);
  });
}

/** Sync notification preferences to the service worker for background scheduling. */
function syncPrefsToSW(prefs) {
  sendViaServiceWorker({ type: "SYNC_PREFS", prefs });
}

function scheduleMorning(hour = 8, minute = 0) {
  clearTimeout(morningTimer);
  const delay = msUntil(hour, minute);
  morningTimer = setTimeout(() => {
    const m = pick(MORNING_MESSAGES);
    sendViaServiceWorker({ type: "SHOW_NOTIFICATION", title: m.title, body: m.body, tag: "lifeos-morning" });
    scheduleMorning(hour, minute);
  }, delay);
}

function scheduleEvening(hour = 21, minute = 0) {
  clearTimeout(eveningTimer);
  const delay = msUntil(hour, minute);
  eveningTimer = setTimeout(() => {
    const m = pick(EVENING_MESSAGES);
    sendViaServiceWorker({ type: "SHOW_NOTIFICATION", title: m.title, body: m.body, tag: "lifeos-evening" });
    scheduleEvening(hour, minute);
  }, delay);
}

// ── Public API ───────────────────────────────────────────────────────────────

/** Request notification permission. Returns true if granted. */
export async function requestPermission() {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  const result = await Notification.requestPermission();
  return result === "granted";
}

/** Register the service worker + periodic background sync. */
export async function registerSW() {
  if (!("serviceWorker" in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register("/sw.js");

    // Register Periodic Background Sync (Chrome Android for installed PWAs)
    if ("periodicSync" in reg) {
      try {
        await reg.periodicSync.register("lifeos-notif-check", { minInterval: 12 * 60 * 60 * 1000 }); // ~12h
      } catch { /* permission not granted or not supported — OK, foreground timers still work */ }
    }

    return reg;
  } catch {
    return null;
  }
}

/** Start or restart notification scheduling.
 *  @param {{ morning: boolean, evening: boolean, morningTime: string, eveningTime: string }} prefs
 */
export function scheduleNotifications(prefs) {
  clearTimeout(morningTimer);
  clearTimeout(eveningTimer);
  morningTimer = null;
  eveningTimer = null;
  currentPrefs = prefs;

  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;

  // Sync prefs to SW for background scheduling
  syncPrefsToSW(prefs);

  // Foreground setTimeout fallback
  if (prefs.morning) {
    const [h, m] = (prefs.morningTime || "08:00").split(":").map(Number);
    scheduleMorning(h, m);
  }
  if (prefs.evening) {
    const [h, m] = (prefs.eveningTime || "21:00").split(":").map(Number);
    scheduleEvening(h, m);
  }
}

/** Stop all scheduled notifications. */
export function cancelNotifications() {
  clearTimeout(morningTimer);
  clearTimeout(eveningTimer);
  morningTimer = null;
  eveningTimer = null;
  currentPrefs = null;
  // Tell SW to clear prefs
  syncPrefsToSW(null);
}

/** Call this once on app init — re-syncs timers when returning from background. */
export function initVisibilityHandler() {
  if (typeof document === "undefined") return;
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && currentPrefs) {
      scheduleNotifications(currentPrefs);
    }
  });
}
