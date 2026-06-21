'use client';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

import { cn } from '@/lib/utils';
export function SparklineCard({ title, value, change, trend = 'neutral', sparkData, sparkColor = '#2563EB', icon, iconBg = 'bg-blue-100', loading = false, }) {
    if (loading) {
        return (<div className="bg-white rounded-2xl border border-gray-200 p-5 animate-pulse">
        <div className="flex items-start justify-between mb-3">
          <div className="h-10 w-10 rounded-xl bg-gray-100"/>
          <div className="h-10 w-16 bg-gray-100 rounded"/>
        </div>
        <div className="h-7 w-24 bg-gray-200 rounded mb-1"/>
        <div className="h-3 w-32 bg-gray-100 rounded"/>
      </div>);
    }
    const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
    const trendColor = trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-500' : 'text-gray-400';
    return (<div className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between mb-3">
        {icon && (<div className={cn('h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0', iconBg)}>
            {icon}
          </div>)}
        {sparkData && sparkData.length > 1 && (<div className="h-12 w-24 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparkData}>
                <defs>
                  <linearGradient id={`sg-${sparkColor.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={sparkColor} stopOpacity={0.2}/>
                    <stop offset="95%" stopColor={sparkColor} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="value" stroke={sparkColor} strokeWidth={1.5} fill={`url(#sg-${sparkColor.replace('#', '')})`} dot={false} isAnimationActive={false}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>)}
      </div>

      <p className="text-2xl font-bold text-gray-900">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      <p className="text-xs text-gray-500 mt-0.5">{title}</p>

      {change && (<div className={cn('flex items-center gap-1 mt-2 text-xs font-medium', trendColor)}>
          <TrendIcon className="h-3 w-3"/>
          {change}
        </div>)}
    </div>);
}
