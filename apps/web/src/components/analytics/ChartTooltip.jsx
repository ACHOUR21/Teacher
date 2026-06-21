'use client';
export function ChartTooltip({ active, payload, label, labelFormatter, valueFormatter, }) {
    if (!active || !payload?.length) {
        return null;
    }
    const displayLabel = labelFormatter ? labelFormatter(label ?? '') : label;
    return (<div className="bg-white border border-gray-200 rounded-xl shadow-lg px-3 py-2.5 text-sm min-w-[120px]">
      {displayLabel && (<p className="text-xs font-medium text-gray-500 mb-2 pb-1.5 border-b border-gray-100">
          {displayLabel}
        </p>)}
      <div className="space-y-1.5">
        {payload.map((entry, i) => {
            const raw = entry.value;
            const formatted = valueFormatter ? valueFormatter(raw, entry.name) : raw;
            return (<div key={i} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: entry.color }}/>
                <span className="text-gray-600 text-xs">{entry.name}</span>
              </div>
              <span className="font-semibold text-gray-900 text-xs tabular-nums">
                {String(formatted)}
              </span>
            </div>);
        })}
      </div>
    </div>);
}
