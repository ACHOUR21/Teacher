'use client';
import { Check } from 'lucide-react';
import React from 'react';

import { cn } from '@/lib/utils';
const STEP_LABELS = {
    1: 'Welcome',
    2: 'Organization',
    3: 'Branding',
    4: 'Invite Team',
    5: 'First Course',
    6: 'Complete',
};
const TOTAL_STEPS = 6;
export function OnboardingProgress({ currentStep }) {
    return (<div className="w-full">
      {/* Progress bar */}
      <div className="h-1.5 w-full bg-gray-200 rounded-full mb-6 overflow-hidden">
        <div className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out" style={{ width: `${((currentStep - 1) / (TOTAL_STEPS - 1)) * 100}%` }}/>
      </div>

      {/* Step indicators */}
      <div className="flex items-start justify-between">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((step) => {
            const isCompleted = step < currentStep;
            const isCurrent = step === currentStep;
            const isPending = step > currentStep;
            return (<div key={step} className="flex flex-col items-center gap-1.5 flex-1">
              {/* Circle */}
              <div className={cn('h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300', isCompleted &&
                    'bg-green-500 text-white shadow-sm shadow-green-200', isCurrent &&
                    'bg-blue-600 text-white shadow-md shadow-blue-200 ring-4 ring-blue-100', isPending && 'bg-gray-100 text-gray-400')}>
                {isCompleted ? (<Check className="h-4 w-4" strokeWidth={3}/>) : (<span>{step}</span>)}
              </div>

              {/* Label */}
              <span className={cn('text-xs text-center leading-tight hidden sm:block', isCompleted && 'text-green-600 font-medium', isCurrent && 'text-blue-700 font-semibold', isPending && 'text-gray-400')}>
                {STEP_LABELS[step]}
              </span>

              {/* Connector line — rendered between steps */}
              {step < TOTAL_STEPS && (<div className={cn('absolute h-0.5 transition-all duration-300', isCompleted ? 'bg-green-400' : 'bg-gray-200')} style={{
                        // The connector is handled by the progress bar above; this
                        // spacer keeps the flex layout symmetrical.
                        display: 'none',
                    }}/>)}
            </div>);
        })}
      </div>
    </div>);
}
