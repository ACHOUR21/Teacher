'use client';
import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

import { useAuthStore } from '@/stores/authStore';
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';
export function useSocket(options = {}) {
    const { namespace = '/', autoConnect = true, extraHeaders = {} } = options;
    const socketRef = useRef(null);
    const handlersRef = useRef({});
    const accessToken = useAuthStore((s) => s.accessToken);
    useEffect(() => {
        if (!autoConnect || !accessToken) {
            return;
        }
        const url = `${SOCKET_URL}${namespace === '/' ? '' : namespace}`;
        const socket = io(url, {
            auth: { token: accessToken },
            extraHeaders,
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 10,
        });
        socketRef.current = socket;
        socket.on('connect', () => {
            console.log(`[Socket] Connected to ${namespace}`);
        });
        socket.on('disconnect', (reason) => {
            console.log(`[Socket] Disconnected: ${reason}`);
        });
        socket.on('connect_error', (err) => {
            console.error('[Socket] Connection error:', err.message);
        });
        // Re-attach any registered handlers
        Object.entries(handlersRef.current).forEach(([event, handler]) => {
            socket.on(event, handler);
        });
        return () => {
            socket.removeAllListeners();
            socket.disconnect();
            socketRef.current = null;
        };
    }, [accessToken, namespace, autoConnect]);
    const on = useCallback((event, handler) => {
        const wrappedHandler = handler;
        handlersRef.current[event] = wrappedHandler;
        socketRef.current?.on(event, wrappedHandler);
    }, []);
    const off = useCallback((event) => {
        delete handlersRef.current[event];
        socketRef.current?.off(event);
    }, []);
    const emit = useCallback((event, data, callback) => {
        if (!socketRef.current?.connected) {
            console.warn('[Socket] Cannot emit — not connected');
            return;
        }
        if (callback) {
            socketRef.current.emit(event, data, callback);
        }
        else {
            socketRef.current.emit(event, data);
        }
    }, []);
    const joinRoom = useCallback((roomId) => {
        emit('join-room', { roomId });
    }, [emit]);
    const leaveRoom = useCallback((roomId) => {
        emit('leave-room', { roomId });
    }, [emit]);
    const isConnected = () => socketRef.current?.connected ?? false;
    return {
        socket: socketRef.current,
        on,
        off,
        emit,
        joinRoom,
        leaveRoom,
        isConnected,
    };
}
// Specialized hook for live classroom
export function useLiveClassSocket(sessionId) {
    const socket = useSocket({ namespace: '/live' });
    useEffect(() => {
        if (sessionId) {
            socket.joinRoom(sessionId);
            return () => {
                socket.leaveRoom(sessionId);
            };
        }
    }, [sessionId, socket.joinRoom, socket.leaveRoom]);
    return socket;
}
