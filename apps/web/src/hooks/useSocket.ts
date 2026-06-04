'use client';

import { useEffect, useRef, useCallback } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/authStore';

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';

type EventMap = Record<string, (...args: unknown[]) => void>;

interface UseSocketOptions {
  namespace?: string;
  autoConnect?: boolean;
  extraHeaders?: Record<string, string>;
}

export function useSocket(options: UseSocketOptions = {}) {
  const { namespace = '/', autoConnect = true, extraHeaders = {} } = options;
  const socketRef = useRef<Socket | null>(null);
  const handlersRef = useRef<EventMap>({});
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (!autoConnect || !accessToken) return;

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
  }, [accessToken, namespace, autoConnect]); // eslint-disable-line react-hooks/exhaustive-deps

  const on = useCallback(
    <T = unknown>(event: string, handler: (data: T) => void) => {
      const wrappedHandler = handler as (...args: unknown[]) => void;
      handlersRef.current[event] = wrappedHandler;
      socketRef.current?.on(event, wrappedHandler);
    },
    []
  );

  const off = useCallback((event: string) => {
    delete handlersRef.current[event];
    socketRef.current?.off(event);
  }, []);

  const emit = useCallback(
    <T = unknown>(event: string, data?: T, callback?: (response: unknown) => void) => {
      if (!socketRef.current?.connected) {
        console.warn('[Socket] Cannot emit — not connected');
        return;
      }
      if (callback) {
        socketRef.current.emit(event, data, callback);
      } else {
        socketRef.current.emit(event, data);
      }
    },
    []
  );

  const joinRoom = useCallback((roomId: string) => {
    emit('join-room', { roomId });
  }, [emit]);

  const leaveRoom = useCallback((roomId: string) => {
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
export function useLiveClassSocket(sessionId: string) {
  const socket = useSocket({ namespace: '/live' });

  useEffect(() => {
    if (sessionId) {
      socket.joinRoom(sessionId);
      return () => {
        socket.leaveRoom(sessionId);
      };
    }
  }, [sessionId, socket.joinRoom, socket.leaveRoom]); // eslint-disable-line react-hooks/exhaustive-deps

  return socket;
}
