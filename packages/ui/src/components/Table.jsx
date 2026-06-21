import * as React from 'react';

import { cn } from '../utils.js';

import { Spinner } from './Spinner.jsx';
/**
 * Data table with column definitions, loading state, and empty state.
 *
 * @example
 * ```tsx
 * const columns: TableColumn<Student>[] = [
 *   { key: 'name', header: 'Name' },
 *   { key: 'grade', header: 'Grade', align: 'center' },
 *   {
 *     key: 'status',
 *     header: 'Status',
 *     render: (row) => <Badge variant={row.active ? 'success' : 'secondary'}>{row.active ? 'Active' : 'Inactive'}</Badge>,
 *   },
 * ];
 *
 * <Table columns={columns} data={students} loading={isLoading} />
 * ```
 */
function Table({ columns, data, loading = false, emptyState, getRowKey, onRowClick, className, tableClassName, }) {
    const alignClass = {
        left: 'text-left',
        center: 'text-center',
        right: 'text-right',
    };
    const isEmpty = data.length === 0 && !loading;
    return (<div className={cn('relative w-full overflow-auto rounded-lg border', className)}>
      {/* Loading overlay */}
      {loading && (<div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-[2px]" aria-live="polite" aria-label="Loading table data">
          <Spinner size="lg" className="text-primary"/>
        </div>)}

      <table className={cn('w-full caption-bottom text-sm', tableClassName)} aria-busy={loading}>
        {/* ── Head ─────────────────────────────────────────────────────── */}
        <thead className="border-b bg-muted/50">
          <tr>
            {columns.map((col) => (<th key={col.key} scope="col" className={cn('h-10 px-4 font-medium text-muted-foreground', alignClass[col.align ?? 'left'], col.headerClassName)}>
                {col.header}
              </th>))}
          </tr>
        </thead>

        {/* ── Body ─────────────────────────────────────────────────────── */}
        <tbody className="[&_tr:last-child]:border-0">
          {isEmpty ? (<tr>
              <td colSpan={columns.length} className="h-32 text-center text-muted-foreground">
                {emptyState ?? 'No data available.'}
              </td>
            </tr>) : (data.map((row, rowIndex) => {
            const key = getRowKey ? getRowKey(row, rowIndex) : rowIndex;
            return (<tr key={key} onClick={onRowClick ? () => onRowClick(row, rowIndex) : undefined} className={cn('border-b transition-colors', 'hover:bg-muted/50', onRowClick && 'cursor-pointer')}>
                  {columns.map((col) => (<td key={col.key} className={cn('px-4 py-3 align-middle', alignClass[col.align ?? 'left'], col.cellClassName)}>
                      {col.render
                        ? col.render(row, rowIndex)
                        : String(row[col.key] ?? '')}
                    </td>))}
                </tr>);
        }))}
        </tbody>
      </table>
    </div>);
}
export { Table };
