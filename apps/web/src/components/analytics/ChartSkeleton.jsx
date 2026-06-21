'use client';
export function ChartSkeleton({ height = 220, rows = 4 }) {
    return (<div className="animate-pulse" style={{ height }}>
      {/* Y-axis placeholder */}
      <div className="flex h-full gap-3">
        <div className="flex flex-col justify-between py-2">
          {Array.from({ length: rows }).map((_, i) => (<div key={i} className="h-2 w-8 bg-gray-100 rounded"/>))}
        </div>
        {/* Chart area */}
        <div className="flex-1 flex items-end gap-2 pb-6">
          {Array.from({ length: 8 }).map((_, i) => (<div key={i} className="flex-1 bg-gray-100 rounded-t" style={{ height: `${25 + ((i * 37 + 17) % 60)}%` }}/>))}
        </div>
      </div>
    </div>);
}
