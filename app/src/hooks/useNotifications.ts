import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/api';

export interface AppNotification {
    id: string;
    userId: string;
    type: 'new_task' | 'overdue_task' | 'task_started' | 'task_completed';
    title: string;
    message: string;
    taskId: string | null;
    isRead: boolean;
    createdAt: string;
}

export function useNotifications(enabled = true) {
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const fetchUnreadCount = useCallback(async () => {
        if (!enabled) return;
        try {
            const data = await api.getUnreadNotificationCount();
            setUnreadCount(data.count);
        } catch {
            // silently fail
        }
    }, [enabled]);

    const loadNotifications = useCallback(async () => {
        if (!enabled) return;
        setIsLoading(true);
        try {
            const data = await api.getNotifications();
            setNotifications(data);
            setUnreadCount(data.filter((n: AppNotification) => !n.isRead).length);
        } catch {
            // silently fail
        } finally {
            setIsLoading(false);
        }
    }, [enabled]);

    const markAsRead = useCallback(async (id: string) => {
        try {
            await api.markNotificationRead(id);
            setNotifications(prev =>
                prev.map(n => (n.id === id ? { ...n, isRead: true } : n)),
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch {
            // silently fail
        }
    }, []);

    const markAllAsRead = useCallback(async () => {
        try {
            await api.markAllNotificationsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch {
            // silently fail
        }
    }, []);

    // Poll unread count every 30 seconds
    useEffect(() => {
        if (!enabled) return;

        fetchUnreadCount();

        intervalRef.current = setInterval(fetchUnreadCount, 30_000);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [enabled, fetchUnreadCount]);

    return {
        notifications,
        unreadCount,
        isLoading,
        loadNotifications,
        markAsRead,
        markAllAsRead,
    };
}
