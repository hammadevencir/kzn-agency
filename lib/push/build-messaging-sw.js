import { FCM_SW_SDK_VERSION } from "@/lib/push/constants";

/**
 * Build the Firebase Cloud Messaging service worker script body.
 * @param {Record<string, string | undefined>} config
 */
export function buildMessagingServiceWorkerSource(config) {
  const serialized = JSON.stringify(config);
  return `importScripts('https://www.gstatic.com/firebasejs/${FCM_SW_SDK_VERSION}/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/${FCM_SW_SDK_VERSION}/firebase-messaging-compat.js');

firebase.initializeApp(${serialized});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
  const notification = payload.notification || {};
  const data = payload.data || {};
  const title = notification.title || data.title || 'KZN Agency';
  const options = {
    body: notification.body || data.body || '',
    icon: '/avatar.svg',
    badge: '/avatar.svg',
    data: data,
    tag: data.tag || 'kzn-notification',
    renotify: true,
  };

  return self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const link = event.notification.data && event.notification.data.link;
  if (!link) return;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if (client.url.indexOf(link) !== -1 && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(link);
      }
    })
  );
});
`;
}
