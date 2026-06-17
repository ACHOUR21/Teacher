import * as React from 'react';

import { cn } from '../utils.js';
import { Spinner } from './Spinner.js';

// ─── Column definition ────────────────────────────────────────────────────────

export interface TableColumn<T = Record<string, unknown>> {
  /** Unique identifier, also used as `key` when no `render` is provided. */
  key: string;
  /** Header label shown in `<thead>`. */
  header: React.ReactNode;
  /**
   * Custom cell renderer. Receives the row data and its zero-based index.
   * Defaults to `String(row[key])` when omitted.
   */
  render?: (row: T, index: number) => React.ReactNode;
  /** Additional class names for the `<th>` element. */
  headerClassName?: string;
  /** Additional class names for every `<td>` in this column. */
  cellClassName?: string;
  /** Text alignment. Defaults to left. */
  align?: 'left' | 'center' | 'right';
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface TableProps<T = Record<string, unknown>> {
  /** Column definitions. */
  columns: TableColumn<T>[];
  /** Rows of data. Each row will be rendered in a `<tr>`. */
  data: T[];
  /**
   * When true, shows a full-table spinner overlay.
   * Rows are still rendered (but blurred/dimmed) so layout does not shift.
   */
  loading?: boolean;
  /** Content rendered when `data` is empty and `loading` is false. */
  emptyState?: React.ReactNode;
  /** Unique key extractor. Defaults to the row's array index. */
  getRowKey?: (row: T, index: number) => React.Key;
  /** Called when a row is clicked. */
  onRowClick?: (row: T, index: number) => void;
  /** Additional class names applied to the `<table>` wrapper div. */
  className?: string;
  /** Additional class names applied to the `<table>` element. */
  tableClassName?: string;
}

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
function Table<T = Record<string, unknown>>({
  columns,
  data,
  loading = false,
  emptyState,
  getRowKey,
  onRowClick,
  className,
  tableClassName,
}: TableProps<T>) {
  const alignClass: Record<NonNullable<TableColumn['align']>, string> = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  const isEmpty = data.length === 0 && !loading;

  return (
    <div className={cn('relative w-full overflow-auto rounded-lg border', className)}>
      {/* Loading overlay */}
      {loading && (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-[2px]"
          aria-live="polite"
          aria-label="Loading table data"
        >
          <Spinner size="lg" className="text-primary" />
        </div>
      )}

      <table
        className={cn('w-full caption-bottom text-sm', tableClassName)}
        aria-busy={loading}
      >
        {/* ── Head ─────────────────────────────────────────────────────── */}
        <thead className="border-b bg-muted/50">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={cn(
                  'h-10 px-4 font-medium text-muted-foreground',
                  alignClass[col.align ?? 'left'],
                  col.headerClassName,
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>

        {/* ── Body ─────────────────────────────────────────────────────── */}
        <tbody className="[&_tr:last-child]:border-0">
          {isEmpty ? (
            <tr>
              <td colSpan={columns.length} className="h-32 text-center text-muted-foreground">
                {emptyState ?? 'No data available.'}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => {
              const key = getRowKey ? getRowKey(row, rowIndex) : rowIndex;
              return (
                <tr
                  key={key}
                  onClick={onRowClick ? () => onRowClick(row, rowIndex) : undefined}
                  className={cn(
                    'border-b transition-colors',
                    'hover:bg-muted/50',
                    onRowClick && 'cursor-pointer',
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        'px-4 py-3 align-middle',
                        alignClass[col.align ?? 'left'],
                        col.cellClassName,
                      )}
                    >
                      {col.render
                        ? col.render(row, rowIndex)
                        : String((row as Record<string, unknown>)[col.key] ?? '')}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export { Table };
