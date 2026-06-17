'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow, isToday, isYesterday, isThisWeek } from 'date-fns';
import { Bell, CheckCheck, BookOpen, ClipboardCheck, Star, Video, MessageSquare, Award, CreditCard, AlertCircle } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

const TYPE_CONFIG: Record<string, { icon: React.ComponentType<any>; color: string; bg: string }> = {
  COURSE_ENROLLED:       { icon: BookOpen,       color: 'text-blue-600',   bg: 'bg-blue-50 dark:bg-blue-950/50' },
  ASSIGNMENT_DUE:        { icon: ClipboardCheck,  color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-950/50' },
  GRADE_PUBLISHED:       { icon: Star,            color: 'text-amber-600',  bg: 'bg-amber-50 dark:bg-amber-950/50' },
  LIVE_SESSION_STARTING: { icon: Video,           color: 'text-red-600',    bg: 'bg-red-50 dark:bg-red-950/50' },
  MESSAGE_RECEIVED:      { icon: MessageSquare,   color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950/50' },
  ACHIEVEMENT_EARNED:    { icon: Award,           color: 'text-green-600',  bg: 'bg-green-50 dark:bg-green-950/50' },
  PAYMENT_SUCCESS:       { icon: CreditCard,      color: 'text-green-600',  bg: 'bg-green-50 dark:bg-green-950/50' },
  PAYMENT_FAILED:        { icon: AlertCircle,     color: 'text-red-600',    bg: 'bg-red-50 dark:bg-red-950/50' },
  GENERAL:               { icon: Bell,            color: 'text-muted-foreground', bg: 'bg-muted' },
};

function getDateGroup(dateStr: string): string {
  const d = new Date(dateStr);
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  if (isThisWeek(d, { weekStartsOn: 1 })) return 'This week';
  return 'Older';
}

const GROUP_ORDER = ['Today', 'Yesterday', 'This week', 'Older'];

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
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Group notifications by date bucket
  const grouped = notifications.reduce<Record<string, any[]>>((acc, n) => {
    const group = getDateGroup(n.createdAt);
    if (!acc[group]) acc[group] = [];
    acc[group].push(n);
    return acc;
  }, {});

  const orderedGroups = GROUP_ORDER.filter(g => grouped[g]?.length > 0);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="h-8 bg-muted rounded w-48 animate-pulse" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-muted-foreground mt-1">{unreadCount} unread</p>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            size="sm"
            variant="outline"
            leftIcon={<CheckCheck className="h-4 w-4" />}
            onClick={() => markAllRead.mutate()}
            loading={markAllRead.isPending}
          >
            Mark all read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-20">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Bell className="h-8 w-8 text-muted-foreground/40" />
          </div>
          <p className="text-foreground font-medium">No notifications yet</p>
          <p className="text-sm text-muted-foreground mt-1">You're all caught up!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orderedGroups.map(groupLabel => (
            <div key={groupLabel}>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
                {groupLabel}
              </h2>
              <div className="bg-card rounded-xl border border-border overflow-hidden divide-y divide-border/50">
                {grouped[groupLabel].map((n: any) => {
                  const config = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.GENERAL;
                  const Icon = config.icon;
                  const isRead = !!n.isRead;

                  return (
                    <div
                      key={n.id}
                      onClick={() => !isRead && markRead.mutate(n.id)}
                      className={cn(
                        'group flex items-start gap-4 px-5 py-4 transition-colors',
                        isRead
                          ? 'bg-card hover:bg-muted/30'
                          : 'bg-primary/5 cursor-pointer hover:bg-primary/10',
                      )}
                    >
                      <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0', config.bg)}>
                        <Icon className={cn('h-5 w-5', config.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={cn('text-sm leading-snug', isRead ? 'text-muted-foreground' : 'text-foreground font-medium')}>
                            {n.title}
                          </p>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                            </span>
                            {!isRead && (
                              <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                            )}
                          </div>
                        </div>
                        {n.body && (
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">{n.body}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
