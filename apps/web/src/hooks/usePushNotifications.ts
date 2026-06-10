'use client';

import { useState, useEffect, useCallback } from 'react';

import { api } from '@/lib/api';
import { isFirebaseConfigured, requestFcmToken, onForegroundMessage } from '@/lib/firebase';

type PushStatus = 'unsupported' | 'unconfigured' | 'default' | 'granted' | 'denied' | 'loading';

export function usePushNotifications() {
  const [status, setStatus] = useState<PushStatus>('loading');
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {return;}
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setStatus('unsupported');
      return;
    }
    if (!isFirebaseConfigured()) {
      setStatus('unconfigured');
      return;
    }
    setStatus(Notification.permission === 'granted' ? 'granted' : 'default');
  }, []);

  // Listen for foreground messages and show them as native notifications
  useEffect(() => {
    if (status !== 'granted') {return;}
    const unsub = onForegroundMessage((payload) => {
      const title = payload.notification?.title ?? 'EduAI';
      const body = payload.notification?.body ?? '';
      if (Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/icon-192.png' });
      }
    });
    return unsub;
  }, [status]);

  const enable = useCallback(async () => {
    setStatus('loading');
    const fcmToken = await requestFcmToken();
    if (!fcmToken) {
      setStatus(Notification.permission as PushStatus);
      return false;
    }
    try {
      await api.post('/notifications/fcm-token', { token: fcmToken, platform: 'WEB' });
      setToken(fcmToken);
      setStatus('granted');
      return true;
    } catch {
      setStatus('default');
      return false;
    }
  }, []);

  const disable = useCallback(async () => {
    if (!token) {return;}
    try {
      await api.delete('/notifications/fcm-token', { data: { token } });
    } finally {
      setToken(null);
      setStatus('default');
    }
  }, [token]);

  return { status, enable, disable, isSupported: status !== 'unsupported', isConfigured: status !== 'unconfigured' };
}
