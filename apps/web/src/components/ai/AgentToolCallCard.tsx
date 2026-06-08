'use client';

import { useState } from 'react';
import { Wrench, ChevronDown, ChevronRight, CheckCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ToolCallEvent } from '@/hooks/useAgentStream';

const TOOL_LABELS: Record<string, string> = {
  get_student_schedule:   'Fetching schedule',
  create_study_plan:      'Creating study plan',
  search_knowledge_base:  'Searching knowledge base',
  search_academic_sources:'Searching academic sources',
  format_citation:        'Formatting citation',
  get_career_insights:    'Fetching career insights',
  get_performance_metrics:'Fetching performance data',
};

interface Props {
  toolCall: ToolCallEvent;
}

export function AgentToolCallCard({ toolCall }: Props) {
  const [expanded, setExpanded] = useState(false);
  const isDone = toolCall.output !== undefined;
  const label = TOOL_LABELS[toolCall.name] ?? toolCall.name.replace(/_/g, ' ');

  return (
    <div className={cn(
      'rounded-xl border text-xs overflow-hidden transition-colors',
      isDone ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50',
    )}>
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left"
      >
        {isDone
          ? <CheckCircle className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
          : <Loader2 className="h-3.5 w-3.5 text-amber-500 animate-spin flex-shrink-0" />}
        <Wrench className="h-3 w-3 text-gray-400 flex-shrink-0" />
        <span className={cn('font-medium flex-1', isDone ? 'text-green-800' : 'text-amber-800')}>
          {label}
        </span>
        {expanded
          ? <ChevronDown className="h-3 w-3 text-gray-400" />
          : <ChevronRight className="h-3 w-3 text-gray-400" />}
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-2 border-t border-inherit pt-2">
          {Object.keys(toolCall.input).length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Input</p>
              <pre className="bg-white/70 rounded p-2 text-[10px] overflow-auto max-h-24 text-gray-700 whitespace-pre-wrap">
                {JSON.stringify(toolCall.input, null, 2)}
              </pre>
            </div>
          )}
          {toolCall.output && (
            <div>
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Output</p>
              <pre className="bg-white/70 rounded p-2 text-[10px] overflow-auto max-h-32 text-gray-700 whitespace-pre-wrap">
                {toolCall.output}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
