'use client';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
function StatusBadge({ status }) {
    if (status === 'up') {
        return (<span className="flex items-center gap-1.5 text-green-600 font-medium">
        <CheckCircle className="h-4 w-4"/> Operational
      </span>);
    }
    if (status === 'unknown') {
        return (<span className="flex items-center gap-1.5 text-yellow-600 font-medium">
        <AlertCircle className="h-4 w-4"/> Unknown
      </span>);
    }
    return (<span className="flex items-center gap-1.5 text-red-600 font-medium">
      <XCircle className="h-4 w-4"/> Down
    </span>);
}
const services = [
    { name: 'Database', key: 'database', label: 'PostgreSQL' },
    { name: 'Cache', key: 'redis', label: 'Redis' },
    { name: 'Memory', key: 'memory', label: 'Heap' },
];
export default function StatusPage() {
    const apiBase = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1').replace(/\/api\/v1\/?$/, '');
    const { data, isLoading, isError, refetch, dataUpdatedAt } = useQuery({
        queryKey: ['system-health'],
        queryFn: () => fetch(`${apiBase}/health`)
            .then((r) => r.json())
            .then((r) => (r.data ?? r)),
        refetchInterval: 30_000,
        retry: 1,
    });
    const isAllGood = !isError && data?.status === 'ok';
    return (<div className="max-w-2xl mx-auto space-y-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">System Status</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isLoading
            ? 'Checking services...'
            : dataUpdatedAt
                ? `Last updated ${new Date(dataUpdatedAt).toLocaleTimeString()}`
                : 'Status unavailable'}
          </p>
        </div>
        <button onClick={() => void refetch()} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <RefreshCw className="h-4 w-4"/> Refresh
        </button>
      </div>

      {/* Overall status banner */}
      <div className={`rounded-xl border-2 p-6 text-center transition-colors ${isLoading
            ? 'border-gray-200 bg-gray-50'
            : isAllGood
                ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950'
                : 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950'}`}>
        {isLoading ? (<div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"/>) : isError || !data ? (<>
            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-2"/>
            <p className="text-lg font-semibold">API unreachable</p>
            <p className="text-sm text-muted-foreground mt-1">
              Could not connect to the backend health endpoint.
            </p>
          </>) : isAllGood ? (<>
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2"/>
            <p className="text-lg font-semibold">All Systems Operational</p>
          </>) : (<>
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-2"/>
            <p className="text-lg font-semibold">Service Disruption Detected</p>
            <p className="text-sm text-muted-foreground mt-1">
              One or more services are experiencing issues.
            </p>
          </>)}
      </div>

      {/* Per-service breakdown */}
      <div className="bg-card rounded-xl border divide-y">
        {services.map((service) => {
            const info = data?.info?.[service.key];
            const status = info?.status ?? (isLoading ? 'loading' : 'unknown');
            return (<div key={service.key} className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium">{service.name}</p>
                <p className="text-xs text-muted-foreground">{service.label}</p>
              </div>
              {isLoading ? (<span className="text-muted-foreground text-sm">Checking...</span>) : (<StatusBadge status={status}/>)}
            </div>);
        })}
      </div>

      {/* Memory details */}
      {data?.info?.memory && (<div className="bg-card rounded-xl border p-4">
          <p className="text-sm font-medium mb-3">Memory Usage</p>
          <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div>
              Heap Used:{' '}
              <span className="font-medium text-foreground">
                {data.info.memory.heapUsedMb != null
                ? `${data.info.memory.heapUsedMb} MB`
                : 'N/A'}
              </span>
            </div>
            <div>
              RSS:{' '}
              <span className="font-medium text-foreground">
                {data.info.memory.rssMb != null ? `${data.info.memory.rssMb} MB` : 'N/A'}
              </span>
            </div>
          </div>
        </div>)}

      {/* Footer note */}
      <p className="text-xs text-center text-muted-foreground">
        Auto-refreshes every 30 seconds. For incidents, check{' '}
        <a href="https://status.eduai.app" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
          status.eduai.app
        </a>
        .
      </p>
    </div>);
}
