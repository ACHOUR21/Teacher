'use client';
import { Download, Check } from 'lucide-react';
import { useState } from 'react';
function toCsv(rows) {
    if (!rows.length) {
        return '';
    }
    const keys = Object.keys(rows[0]);
    const header = keys.join(',');
    const body = rows.map(row => keys.map(k => {
        const v = row[k];
        const s = v === null || v === undefined ? '' : String(v);
        // Quote cells that contain commas, quotes, or newlines
        return /[,"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    }).join(','));
    return [header, ...body].join('\n');
}
export function ExportButton({ data, filename = 'export', label = 'Export CSV' }) {
    const [done, setDone] = useState(false);
    function handleExport() {
        if (!data.length) {
            return;
        }
        const csv = toCsv(data);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setDone(true);
        setTimeout(() => setDone(false), 2000);
    }
    return (<button onClick={handleExport} disabled={!data.length} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
      {done
            ? <><Check className="h-3.5 w-3.5 text-green-500"/> Exported</>
            : <><Download className="h-3.5 w-3.5"/> {label}</>}
    </button>);
}
