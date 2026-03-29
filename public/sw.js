// ── LifeOS Service Worker ─────────────────────────────────────────────────────
// Handles scheduled notification display and click-to-open behaviour.

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

// Show a notification when the main thread sends a message
self.addEventListener("message", (e) => {
  if (e.data && e.data.type === "SHOW_NOTIFICATION") {
    const { title, body, tag } = e.data;
    self.registration.showNotification(title, {
      body,
      tag, // prevents duplicate notifications with same tag
      icon: "/vite.svg",
      badge: "/vite.svg",
      renotify: true,
    });
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
