'use client';

import { useQuery } from '@tanstack/react-query';
import { ShieldAlert, Lock, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import React, { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

type Action = 'ALL' | 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'EXPORT' | 'VIEW';
type Resource = 'ALL' | 'user' | 'course' | 'assignment' | 'billing' | 'tenant';

interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: Omit<Action, 'ALL'>;
  resource: Omit<Resource, 'ALL'>;
  resourceId: string;
  ipAddress: string;
}

interface AuditLogsResponse {
  data: AuditLog[];
  total: number;
  page: number;
  limit: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-700',
  UPDATE: 'bg-blue-100 text-blue-700',
  DELETE: 'bg-red-100 text-red-700',
  LOGIN: 'bg-indigo-100 text-indigo-700',
  LOGOUT: 'bg-gray-100 text-gray-600',
};

function actionBadgeClass(action: string): string {
  return ACTION_COLORS[action] ?? 'bg-orange-100 text-orange-700';
}

function truncate(str: string, max = 16): string {
  if (!str) {return '—';}
  return str.length > max ? `${str.slice(0, max)}…` : str;
}

const PAGE_SIZE = 10;

// ─── Component ────────────────────────────────────────────────────────────────

export default function AuditLogsPage() {
  const [search, setSearch] = useState('');
  const [action, setAction] = useState<Action>('ALL');
  const [resource, setResource] = useState<Resource>('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);

  const filters = { search, action, resource, dateFrom, dateTo, page };

  const { data, isLoading, isError } = useQuery<AuditLogsResponse>({
    queryKey: ['audit-logs', filters],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) {params.set('search', search);}
      if (action !== 'ALL') {params.set('action', action);}
      if (resource !== 'ALL') {params.set('resource', resource);}
      if (dateFrom) {params.set('from', dateFrom);}
      if (dateTo) {params.set('to', dateTo);}
      params.set('page', String(page));
      params.set('limit', String(PAGE_SIZE));
      return api.get(`/audit/logs?${params.toString()}`).then(r => r.data.data);
    },
    placeholderData: (prev) => prev,
  });

  const logs: AuditLog[] = data?.data ?? [];
  const total: number = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);

  async function handleExportCsv() {
    try {
      setExporting(true);
      const params = new URLSearchParams();
      if (action !== 'ALL') {params.set('action', action);}
      if (dateFrom) {params.set('startDate', dateFrom);}
      if (dateTo) {params.set('endDate', dateTo);}
      const response = await api.get(`/audit/export/csv?${params.toString()}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  // Reset to page 1 when filters change
  function updateFilter(fn: () => void) {
    fn();
    setPage(1);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-blue-600" />
            Audit Logs
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Track all admin and user actions across the platform
          </p>
        </div>
        <Button
          variant="outline"
          leftIcon={<Download className="h-4 w-4" />}
          loading={exporting}
          onClick={handleExportCsv}
        >
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search */}
            <input
              type="text"
              placeholder="Search by user email…"
              value={search}
              onChange={e => updateFilter(() => setSearch(e.target.value))}
              className="col-span-1 sm:col-span-2 lg:col-span-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* Action */}
            <select
              value={action}
              onChange={e => updateFilter(() => setAction(e.target.value as Action))}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {(['ALL', 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'VIEW'] as Action[]).map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>

            {/* Resource */}
            <select
              value={resource}
              onChange={e => updateFilter(() => setResource(e.target.value as Resource))}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {(['ALL', 'user', 'course', 'assignment', 'billing', 'tenant'] as Resource[]).map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>

            {/* Date From */}
            <input
              type="date"
              value={dateFrom}
              onChange={e => updateFilter(() => setDateFrom(e.target.value))}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* Date To */}
            <input
              type="date"
              value={dateTo}
              onChange={e => updateFilter(() => setDateTo(e.target.value))}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Timestamp</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Resource</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Resource ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {isLoading ? (
                  // Loading skeleton
                  Array.from({ length: PAGE_SIZE }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 6 }).map((__, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-gray-200 rounded animate-pulse" style={{ width: j === 0 ? '140px' : j === 1 ? '160px' : '80px' }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : isError ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-sm text-red-500">
                      Failed to load audit logs. Please try again.
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  // Empty state
                  <tr>
                    <td colSpan={6} className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Lock className="h-10 w-10 text-gray-300" />
                        <p className="text-sm text-gray-400 font-medium">No audit logs found</p>
                        <p className="text-xs text-gray-300">Try adjusting your filters</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-gray-900">
                        {log.user}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          'inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase',
                          actionBadgeClass(String(log.action))
                        )}>
                          {String(log.action)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 capitalize">
                        {String(log.resource)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-gray-500" title={log.resourceId}>
                          {truncate(log.resourceId)}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">
                        {log.ipAddress}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!isLoading && total > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                Showing <span className="font-medium">{rangeStart}</span>–<span className="font-medium">{rangeEnd}</span> of{' '}
                <span className="font-medium">{total}</span> entries
              </p>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  leftIcon={<ChevronLeft className="h-3.5 w-3.5" />}
                >
                  Prev
                </Button>
                <span className="text-xs text-gray-500 px-1">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  rightIcon={<ChevronRight className="h-3.5 w-3.5" />}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
