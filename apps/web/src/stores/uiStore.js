import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
let notificationIdCounter = 0;
export const useUIStore = create()(persist((set) => ({
    sidebarOpen: false,
    sidebarCollapsed: false,
    theme: 'system',
    notifications: [],
    unreadCount: 0,
    toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    setSidebarOpen: (open) => set({ sidebarOpen: open }),
    toggleSidebarCollapsed: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
    setTheme: (theme) => set({ theme }),
    addNotification: (notification) => {
        const id = `notif-${++notificationIdCounter}-${Date.now()}`;
        const newNotif = {
            ...notification,
            id,
            read: false,
            createdAt: new Date().toISOString(),
        };
        set((state) => ({
            notifications: [newNotif, ...state.notifications].slice(0, 50),
            unreadCount: state.unreadCount + 1,
        }));
    },
    markNotificationRead: (id) => {
        set((state) => {
            const notifications = state.notifications.map((n) => n.id === id ? { ...n, read: true } : n);
            const unreadCount = notifications.filter((n) => !n.read).length;
            return { notifications, unreadCount };
        });
    },
    markAllNotificationsRead: () => {
        set((state) => ({
            notifications: state.notifications.map((n) => ({
                ...n,
                read: true,
            })),
            unreadCount: 0,
        }));
    },
    clearNotifications: () => set({ notifications: [], unreadCount: 0 }),
    removeNotification: (id) => {
        set((state) => {
            const notifications = state.notifications.filter((n) => n.id !== id);
            const unreadCount = notifications.filter((n) => !n.read).length;
            return { notifications, unreadCount };
        });
    },
    setUnreadCount: (count) => set({ unreadCount: count }),
}), {
    name: 'eduai-ui',
    storage: createJSONStorage(() => localStorage),
    partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
    }),
}));
