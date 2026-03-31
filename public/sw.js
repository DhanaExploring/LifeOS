// ── LifeOS Service Worker ─────────────────────────────────────────────────────
// Handles scheduled notification display, periodic background sync,
// and click-to-open behaviour for mobile PWA support.

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

// ── Notification preferences (stored in SW scope) ────────────────────────────
let notifPrefs = null; // { morning, evening, morningTime, eveningTime }

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

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function parseTime(str, fallbackH, fallbackM) {
  if (!str) return [fallbackH, fallbackM];
  const [h, m] = str.split(":").map(Number);
  return [isNaN(h) ? fallbackH : h, isNaN(m) ? fallbackM : m];
}

// Check if now is within a 15-minute window after the target time
function isInWindow(hour, minute) {
  const now = new Date();
  const target = new Date(now);
  target.setHours(hour, minute, 0, 0);
  const diff = now - target;
  return diff >= 0 && diff < 15 * 60 * 1000; // within 15 min window
}

// Track last notification dates to avoid duplicates
let lastMorningDate = "";
let lastEveningDate = "";

function checkAndNotify() {
  if (!notifPrefs) return;
  const todayStr = new Date().toISOString().split("T")[0];

  if (notifPrefs.morning) {
    const [h, m] = parseTime(notifPrefs.morningTime, 8, 0);
    if (isInWindow(h, m) && lastMorningDate !== todayStr) {
      lastMorningDate = todayStr;
      const msg = pick(MORNING_MESSAGES);
      self.registration.showNotification(msg.title, {
        body: msg.body, tag: "lifeos-morning", icon: "/vite.svg", badge: "/vite.svg", renotify: true,
      });
    }
  }

  if (notifPrefs.evening) {
    const [h, m] = parseTime(notifPrefs.eveningTime, 21, 0);
    if (isInWindow(h, m) && lastEveningDate !== todayStr) {
      lastEveningDate = todayStr;
      const msg = pick(EVENING_MESSAGES);
      self.registration.showNotification(msg.title, {
        body: msg.body, tag: "lifeos-evening", icon: "/vite.svg", badge: "/vite.svg", renotify: true,
      });
    }
  }
}

// ── Message handler (prefs sync + direct show) ──────────────────────────────
self.addEventListener("message", (e) => {
  if (e.data && e.data.type === "SYNC_PREFS") {
    notifPrefs = e.data.prefs;
    checkAndNotify(); // check immediately after receiving prefs
  }
  if (e.data && e.data.type === "SHOW_NOTIFICATION") {
    const { title, body, tag } = e.data;
    self.registration.showNotification(title, {
      body, tag, icon: "/vite.svg", badge: "/vite.svg", renotify: true,
    });
  }
});

// ── Periodic Background Sync (wakes SW even when app is closed) ─────────────
self.addEventListener("periodicsync", (e) => {
  if (e.tag === "lifeos-notif-check") {
    e.waitUntil(Promise.resolve(checkAndNotify()));
  }
});

// Open the app when notification is clicked
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const c of clients) {
        if (c.url.includes(self.location.origin) && "focus" in c) return c.focus();
      }
      return self.clients.openWindow("/");
    })
  );
});
