import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

import { toast } from '@/hooks/useToast';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
let socket = null;
export function useNotificationSocket() {
    const { accessToken } = useAuthStore();
    const { addNotification, setUnreadCount } = useUIStore();
    // Keep a stable ref so the effect only re-runs when accessToken changes
    const addNotificationRef = useRef(addNotification);
    const setUnreadCountRef = useRef(setUnreadCount);
    addNotificationRef.current = addNotification;
    setUnreadCountRef.current = setUnreadCount;
    useEffect(() => {
        if (!accessToken) {
            return;
        }
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
        socket.on('notification', (notification) => {
            // Update store so the bell badge and dropdown reflect the new item
            addNotificationRef.current({
                title: notification.title,
                message: notification.message,
                type: notification.type,
                href: notification.href,
            });
            // Show a toast so the user sees the alert even if the dropdown is closed
            const variant = (() => {
                switch (notification.type) {
                    case 'success': return 'success';
                    case 'error':
                    case 'warning': return 'warning';
                    default: return 'default';
                }
            })();
            toast({ title: notification.title, description: notification.message, variant });
        });
        // Backend emits this after marking notifications read or when creating new ones
        socket.on('unread_count', (count) => {
            setUnreadCountRef.current(count);
        });
        return () => {
            socket?.disconnect();
            socket = null;
        };
    }, [accessToken]);
}
