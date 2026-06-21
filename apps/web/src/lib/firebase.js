import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};
export function isFirebaseConfigured() {
    return !!(firebaseConfig.apiKey &&
        firebaseConfig.messagingSenderId &&
        firebaseConfig.appId);
}
let app = null;
let messaging = null;
export function getFirebaseApp() {
    if (!isFirebaseConfigured()) {
        return null;
    }
    if (!app) {
        app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    }
    return app;
}
export function getFirebaseMessaging() {
    if (typeof window === 'undefined') {
        return null;
    }
    const a = getFirebaseApp();
    if (!a) {
        return null;
    }
    if (!messaging) {
        try {
            messaging = getMessaging(a);
        }
        catch {
            return null;
        }
    }
    return messaging;
}
export async function requestFcmToken() {
    const m = getFirebaseMessaging();
    if (!m) {
        return null;
    }
    try {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            return null;
        }
        const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
        const token = await getToken(m, { vapidKey });
        return token || null;
    }
    catch (err) {
        console.warn('FCM token request failed:', err);
        return null;
    }
}
export function onForegroundMessage(handler) {
    const m = getFirebaseMessaging();
    if (!m) {
        return () => { };
    }
    return onMessage(m, handler);
}
