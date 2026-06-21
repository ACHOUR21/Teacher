import * as React from 'react';

import { cn } from '../utils.js';
/**
 * Accessible tab component with controlled active state.
 *
 * Keyboard navigation: ArrowLeft / ArrowRight moves between tabs, Enter/Space
 * activates the focused tab.
 *
 * @example
 * ```tsx
 * const tabs: TabItem[] = [
 *   { id: 'overview', label: 'Overview', content: <Overview /> },
 *   { id: 'students', label: 'Students', content: <StudentList /> },
 *   { id: 'settings', label: 'Settings', content: <Settings />, disabled: true },
 * ];
 *
 * <Tabs items={tabs} activeId={active} onChange={setActive} />
 * ```
 */
function Tabs({ items, activeId, onChange, variant = 'line', className, listClassName, panelClassName, }) {
    const tabListRef = React.useRef(null);
    // ── Keyboard navigation ────────────────────────────────────────────────────
    function handleKeyDown(e, currentIndex) {
        const enabledItems = items.filter((t) => !t.disabled);
        const currentItem = items[currentIndex];
        const currentEnabledIndex = currentItem ? enabledItems.findIndex((t) => t.id === currentItem.id) : 0;
        let nextIndex;
        if (e.key === 'ArrowRight') {
            nextIndex = (currentEnabledIndex + 1) % enabledItems.length;
        }
        else if (e.key === 'ArrowLeft') {
            nextIndex = (currentEnabledIndex - 1 + enabledItems.length) % enabledItems.length;
        }
        else if (e.key === 'Home') {
            nextIndex = 0;
        }
        else if (e.key === 'End') {
            nextIndex = enabledItems.length - 1;
        }
        if (nextIndex !== undefined) {
            e.preventDefault();
            const nextTab = enabledItems[nextIndex];
            if (!nextTab) {
                return;
            }
            onChange(nextTab.id);
            // Move focus to the newly activated tab button
            const btn = tabListRef.current?.querySelector(`[data-tab-id="${nextTab.id}"]`);
            btn?.focus();
        }
    }
    const activeItem = items.find((t) => t.id === activeId);
    return (<div className={cn('flex flex-col', className)}>
      {/* ── Tab list ─────────────────────────────────────────────────────── */}
      <div ref={tabListRef} role="tablist" aria-orientation="horizontal" className={cn('flex', variant === 'line' && 'border-b', variant === 'pills' && 'gap-1 rounded-lg bg-muted p-1', listClassName)}>
        {items.map((item, index) => {
            const isActive = item.id === activeId;
            return (<button key={item.id} type="button" role="tab" data-tab-id={item.id} id={`tab-${item.id}`} aria-selected={isActive} aria-controls={`panel-${item.id}`} disabled={item.disabled} tabIndex={isActive ? 0 : -1} onClick={() => !item.disabled && onChange(item.id)} onKeyDown={(e) => handleKeyDown(e, index)} className={cn('inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-medium', 'transition-colors duration-150', 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1', 'disabled:pointer-events-none disabled:opacity-50', 
                // Line variant
                variant === 'line' && [
                    'border-b-2 px-4 pb-2 pt-2',
                    isActive
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground',
                ], 
                // Pills variant
                variant === 'pills' && [
                    'rounded-md px-3 py-1.5',
                    isActive
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-background/60 hover:text-foreground',
                ])}>
              {item.icon && (<span className="shrink-0 [&_svg]:h-4 [&_svg]:w-4" aria-hidden="true">
                  {item.icon}
                </span>)}
              {item.label}
              {item.badge && (<span className="ml-0.5 shrink-0">{item.badge}</span>)}
            </button>);
        })}
      </div>

      {/* ── Tab panel ────────────────────────────────────────────────────── */}
      {activeItem && (<div role="tabpanel" id={`panel-${activeItem.id}`} aria-labelledby={`tab-${activeItem.id}`} tabIndex={0} className={cn('mt-4 focus-visible:outline-none', panelClassName)}>
          {activeItem.content}
        </div>)}
    </div>);
}
export { Tabs };
