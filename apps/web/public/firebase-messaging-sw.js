// Firebase Messaging Service Worker
// This file must be at the root of the public directory so it is served at /firebase-messaging-sw.js

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Config is injected at runtime by the web app via a POST message, or you can hardcode it here.
// For production, populate these values from your Firebase console.
const firebaseConfig = self.__FIREBASE_CONFIG__ || {
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: '',
};

if (firebaseConfig.apiKey) {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  // Handle background messages (app is closed or in background)
  messaging.onBackgroundMessage((payload) => {
    const title = payload.notification?.title ?? 'EduAI';
    const body = payload.notification?.body ?? '';
    const icon = '/icon-192.png';

    self.registration.showNotification(title, {
      body,
      icon,
      badge: '/icon-72.png',
      data: payload.data ?? {},
    });
  });
}

// Allow the web app to inject Firebase config at runtime
self.addEventListener('message', (event) => {
  if (event.data?.type === 'FIREBASE_CONFIG') {
    self.__FIREBASE_CONFIG__ = event.data.config;
  }
});
