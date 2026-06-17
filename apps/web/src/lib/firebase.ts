import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, type Messaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export function isFirebaseConfigured(): boolean {
  return !!(
    firebaseConfig.apiKey &&
    firebaseConfig.messagingSenderId &&
    firebaseConfig.appId
  );
}

let app: FirebaseApp | null = null;
let messaging: Messaging | null = null;

export function getFirebaseApp(): FirebaseApp | null {
  if (!isFirebaseConfigured()) {return null;}
  if (!app) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  }
  return app;
}

export function getFirebaseMessaging(): Messaging | null {
  if (typeof window === 'undefined') {return null;}
  const a = getFirebaseApp();
  if (!a) {return null;}
  if (!messaging) {
    try {
      messaging = getMessaging(a);
    } catch {
      return null;
    }
  }
  return messaging;
}

export async function requestFcmToken(): Promise<string | null> {
  const m = getFirebaseMessaging();
  if (!m) {return null;}

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {return null;}

    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    const token = await getToken(m, { vapidKey });
    return token || null;
  } catch (err) {
    console.warn('FCM token request failed:', err);
    return null;
  }
}

export function onForegroundMessage(
  handler: (payload: { notification?: { title?: string; body?: string }; data?: Record<string, string> }) => void,
) {
  const m = getFirebaseMessaging();
  if (!m) {return () => {};}
  return onMessage(m, handler);
}
