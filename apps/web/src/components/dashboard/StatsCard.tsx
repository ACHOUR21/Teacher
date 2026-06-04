import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn, formatNumber } from '@/lib/utils';
import { Card } from '@/components/ui/Card';

interface StatsCardProps {
  title: string;
  value: string | number;
  trend?: number; // percentage change, positive or negative
  trendLabel?: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor?: string;
  iconBgColor?: string;
  prefix?: string;
  suffix?: string;
  loading?: boolean;
}

export function StatsCard({
  title,
  value,
  trend,
  trendLabel = 'vs last month',
  icon: Icon,
  iconColor = 'text-primary',
  iconBgColor = 'bg-primary/10',
  prefix,
  suffix,
  loading = false,
}: StatsCardProps) {
  const isPositive = trend !== undefined && trend > 0;
  const isNegative = trend !== undefined && trend < 0;
  const isNeutral = trend === 0;

  const displayValue =
    typeof value === 'number' ? formatNumber(value) : value;

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-3 flex-1">
            <div className="h-4 w-24 rounded bg-muted animate-pulse" />
            <div className="h-8 w-32 rounded bg-muted animate-pulse" />
            <div className="h-3 w-20 rounded bg-muted animate-pulse" />
          </div>
          <div className="h-12 w-12 rounded-xl bg-muted animate-pulse" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 hover:shadow-card-hover transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-muted-foreground truncate">
            {title}
          </p>
          <div className="mt-1.5 flex items-baseline gap-1">
            {prefix && (
              <span className="text-lg font-bold text-foreground">{prefix}</span>
            )}
            <span className="text-2xl font-bold text-foreground">
              {displayValue}
            </span>
            {suffix && (
              <span className="text-sm font-medium text-muted-foreground">
                {suffix}
              </span>
            )}
          </div>

          {trend !== undefined && (
            <div className="mt-2 flex items-center gap-1">
              <div
                className={cn(
                  'flex items-center gap-0.5 text-xs font-semibold',
                  isPositive && 'text-green-600',
                  isNegative && 'text-red-600',
                  isNeutral && 'text-muted-foreground'
                )}
              >
                {isPositive && <TrendingUp className="h-3.5 w-3.5" />}
                {isNegative && <TrendingDown className="h-3.5 w-3.5" />}
                {isNeutral && <Minus className="h-3.5 w-3.5" />}
                <span>
                  {isPositive ? '+' : ''}
                  {trend.toFixed(1)}%
                </span>
              </div>
              <span className="text-xs text-muted-foreground">{trendLabel}</span>
            </div>
          )}
        </div>

        <div
          className={cn(
            'h-12 w-12 rounded-xl flex items-center justify-center shrink-0',
            iconBgColor
          )}
        >
          <Icon className={cn('h-6 w-6', iconColor)} />
        </div>
      </div>
    </Card>
  );
}
