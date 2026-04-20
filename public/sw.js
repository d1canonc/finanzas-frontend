self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(clients.claim()));

self.addEventListener("push", event => {
  if (!event.data) return;
  let d;
  try { d = event.data.json(); } catch { d = { title: "Finanzas", body: event.data.text() }; }
  event.waitUntil(
    self.registration.showNotification(d.title || "finanzas.", {
      body: d.body, icon: "/icon.png", badge: "/icon.png",
      tag: d.tag || "fin", requireInteraction: d.requireInteraction || false, data: d.data || {},
    })
  );
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  const d = event.notification.data || {};
  let url = "/app";
  if (d.type === "needs_info") url = "/app?view=pending";
  if (d.type === "credit_alert" || d.type === "pay_reminder") url = "/app";
  event.waitUntil(
    clients.matchAll({ type: "window" }).then(ws => {
      for (const w of ws) { if (w.url.includes("/app") && "focus" in w) { w.navigate(url); return w.focus(); } }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
