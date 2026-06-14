// public/firebase-messaging-sw.js
// This service worker handles FCM push notifications when the browser tab is closed or in background.
// NOTE: Cannot use process.env here — must hardcode public Firebase values.

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyA6AlhUj9n5unvepkjJR-sBBel8bJgmITU",
    authDomain: "hotstar-clone-de5fa.firebaseapp.com",
    projectId: "hotstar-clone-de5fa",
    storageBucket: "hotstar-clone-de5fa.firebasestorage.app",
    messagingSenderId: "636106073273",
    appId: "1:636106073273:web:52b407df5a1f33b2fea768"
});

const messaging = firebase.messaging();

// Handle background messages (when tab is not focused or browser is closed)
messaging.onBackgroundMessage((payload) => {
    console.log('[SW] Background message received:', payload);

    const { title, body, icon, image, badge } = payload.notification || {};
    const data = payload.data || {};

    self.registration.showNotification(title || 'OrbitX Talk', {
        body: body || 'You have a new message',
        icon: icon || '/icon-192.png',
        badge: badge || '/icon-72.png',
        image: image,
        tag: data.senderId || 'orbitx-message', // Groups notifications from same sender
        renotify: true,
        data: {
            url: data.url || '/chat',
            senderId: data.senderId,
        },
        actions: [
            { action: 'open', title: 'Open Chat' },
            { action: 'dismiss', title: 'Dismiss' }
        ]
    });
});

// Handle notification click — open the chat page
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'dismiss') return;

    const url = event.notification.data?.url || '/chat';
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // Focus existing tab if open
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    client.focus();
                    client.navigate(url);
                    return;
                }
            }
            // Otherwise open a new tab
            if (clients.openWindow) {
                return clients.openWindow(url);
            }
        })
    );
});
