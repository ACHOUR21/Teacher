import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';

let socket: Socket | null = null;

export function useNotificationSocket() {
  const { accessToken } = useAuthStore();
  const { addNotification } = useUIStore();

  useEffect(() => {
    if (!accessToken) return;

    const wsUrl = process.env['NEXT_PUBLIC_WS_URL'] || 'http://localhost:3001';

    socket = io(wsUrl, {
      auth: { token: accessToken },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    // Join personal notification room so the backend can target this user
    socket.on('connect', () => {
      socket?.emit('subscribe');
    });

    socket.on('notification', (notification: {
      id: string;
      title: string;
      message: string;
      type: string;
      href?: string;
      createdAt: string;
    }) => {
      addNotification({
        title: notification.title,
        message: notification.message,
        type: notification.type as 'info' | 'success' | 'warning' | 'error',
        href: notification.href,
      });
    });

    return () => {
      socket?.disconnect();
      socket = null;
    };
  }, [accessToken, addNotification]);
}
