'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck, BookOpen, ClipboardCheck, Star, Video, MessageSquare, Award, CreditCard, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

const TYPE_CONFIG: Record<string, { icon: React.ComponentType<any>; color: string; bg: string }> = {
  COURSE_ENROLLED:     { icon: BookOpen,      color: 'text-blue-600',   bg: 'bg-blue-50' },
  ASSIGNMENT_DUE:      { icon: ClipboardCheck, color: 'text-orange-600', bg: 'bg-orange-50' },
  GRADE_PUBLISHED:     { icon: Star,           color: 'text-amber-600',  bg: 'bg-amber-50' },
  LIVE_SESSION_STARTING: { icon: Video,        color: 'text-red-600',    bg: 'bg-red-50' },
  MESSAGE_RECEIVED:    { icon: MessageSquare,  color: 'text-purple-600', bg: 'bg-purple-50' },
  ACHIEVEMENT_EARNED:  { icon: Award,          color: 'text-green-600',  bg: 'bg-green-50' },
  PAYMENT_SUCCESS:     { icon: CreditCard,     color: 'text-green-600',  bg: 'bg-green-50' },
  PAYMENT_FAILED:      { icon: AlertCircle,    color: 'text-red-600',    bg: 'bg-red-50' },
  GENERAL:             { icon: Bell,           color: 'text-gray-600',   bg: 'bg-gray-100' },
};

export default function NotificationsPage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then(r => r.data.data),
  });

  const markAllRead = useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markRead = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const notifications: any[] = data?.data ?? [];
  const unreadCount = notifications.filter(n => !n.readAt).length;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-100 rounded w-48 animate-pulse" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-500 mt-1">{unreadCount} unread</p>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            size="sm"
            variant="outline"
            leftIcon={<CheckCheck className="h-4 w-4" />}
            onClick={() => markAllRead.mutate()}
            isLoading={markAllRead.isPending}
          >
            Mark all read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-20">
          <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Bell className="h-8 w-8 text-gray-300" />
          </div>
          <p className="text-gray-500 font-medium">No notifications yet</p>
          <p className="text-sm text-gray-400 mt-1">You're all caught up!</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden divide-y divide-gray-50">
          {notifications.map((n: any) => {
            const config = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.GENERAL;
            const Icon = config.icon;
            const isRead = !!n.readAt;

            return (
              <div
                key={n.id}
                onClick={() => !isRead && markRead.mutate(n.id)}
                className={cn(
                  'flex items-start gap-4 px-5 py-4 transition-colors',
                  isRead ? 'bg-white' : 'bg-blue-50/40 cursor-pointer hover:bg-blue-50/60',
                )}
              >
                <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0', config.bg)}>
                  <Icon className={cn('h-5 w-5', config.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={cn('text-sm leading-snug', isRead ? 'text-gray-700' : 'text-gray-900 font-medium')}>
                      {n.title}
                    </p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-gray-400 whitespace-nowrap">
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                      </span>
                      {!isRead && (
                        <div className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                  {n.body && (
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed line-clamp-2">{n.body}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
