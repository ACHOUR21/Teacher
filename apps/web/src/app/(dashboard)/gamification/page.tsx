'use client';

import { useQuery } from '@tanstack/react-query';
import { Trophy, Star, Zap, Medal, Crown, TrendingUp, Award } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

const RANK_COLORS = ['text-amber-500', 'text-gray-400', 'text-orange-400'];
const RANK_BG = ['bg-amber-50', 'bg-gray-50', 'bg-orange-50'];
const RANK_ICONS = [Crown, Medal, Award];

const BADGE_COLORS: Record<string, string> = {
  GOLD: 'bg-amber-100 text-amber-700 border-amber-200',
  SILVER: 'bg-gray-100 text-gray-600 border-gray-200',
  BRONZE: 'bg-orange-100 text-orange-700 border-orange-200',
  PLATINUM: 'bg-purple-100 text-purple-700 border-purple-200',
};

export default function GamificationPage() {
  const { data: stats } = useQuery({
    queryKey: ['gamification-stats'],
    queryFn: () => api.get('/gamification/stats').then(r => r.data.data),
  });

  const { data: leaderboard } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: () => api.get('/gamification/leaderboard').then(r => r.data.data),
  });

  const { data: achievements } = useQuery({
    queryKey: ['achievements'],
    queryFn: () => api.get('/gamification/achievements').then(r => r.data.data),
  });

  const { data: myAchievements } = useQuery({
    queryKey: ['my-achievements'],
    queryFn: () => api.get('/gamification/achievements/my').then(r => r.data.data),
  });

  const earnedIds = new Set((myAchievements ?? []).map((a: any) => a.achievementId));
  const allAchievements: any[] = achievements ?? [];
  const leaderboardData: any[] = (leaderboard as any[]) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gamification</h1>
        <p className="text-sm text-gray-500 mt-1">Earn points, unlock achievements, and climb the leaderboard</p>
      </div>

      {/* My Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: Star, label: 'Total Points', value: stats.totalPoints ?? 0, color: 'text-amber-500', bg: 'bg-amber-50' },
            { icon: Zap, label: 'Weekly Points', value: stats.weeklyPoints ?? 0, color: 'text-blue-500', bg: 'bg-blue-50' },
            { icon: Trophy, label: 'Achievements', value: stats.achievementCount ?? 0, color: 'text-purple-500', bg: 'bg-purple-50' },
            { icon: TrendingUp, label: 'Global Rank', value: stats.rank ? `#${stats.rank}` : '—', color: 'text-green-500', bg: 'bg-green-50' },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center mb-3', stat.bg)}>
                <stat.icon className={cn('h-4.5 w-4.5', stat.color)} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{String(stat.value)}</p>
              <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leaderboard */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-500" /> Leaderboard
          </h2>
          {leaderboardData.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No data yet</p>
          ) : (
            <div className="space-y-2">
              {leaderboardData.slice(0, 10).map((entry: any, i: number) => {
                const RankIcon = i < 3 ? RANK_ICONS[i] : null;
                return (
                  <div
                    key={entry.userId ?? i}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg',
                      i < 3 ? RANK_BG[i] : 'hover:bg-gray-50',
                    )}
                  >
                    <div className={cn('w-7 text-center font-bold text-sm', i < 3 ? RANK_COLORS[i] : 'text-gray-400')}>
                      {RankIcon ? <RankIcon className="h-4 w-4 mx-auto" /> : `#${i + 1}`}
                    </div>
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                      {entry.user?.firstName?.[0]}{entry.user?.lastName?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {entry.user?.firstName} {entry.user?.lastName}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-sm font-semibold text-amber-600">
                      <Star className="h-3.5 w-3.5" />
                      {entry.total?.toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Achievements */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Award className="h-4 w-4 text-purple-500" /> Achievements
            <span className="ml-auto text-xs text-gray-400">{earnedIds.size}/{allAchievements.length} earned</span>
          </h2>
          {allAchievements.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No achievements configured</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {allAchievements.map((ach: any) => {
                const earned = earnedIds.has(ach.id);
                return (
                  <div
                    key={ach.id}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg border transition-colors',
                      earned ? 'border-green-200 bg-green-50' : 'border-gray-100 bg-gray-50 opacity-60',
                    )}
                  >
                    <div className="text-2xl flex-shrink-0">{ach.icon ?? '🏆'}</div>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm font-medium', earned ? 'text-gray-900' : 'text-gray-500')}>
                        {ach.name}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{ach.description}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium', BADGE_COLORS[ach.badgeLevel] ?? BADGE_COLORS.BRONZE)}>
                        {ach.badgeLevel}
                      </span>
                      <span className="text-xs text-amber-600 font-medium">+{ach.points} pts</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
