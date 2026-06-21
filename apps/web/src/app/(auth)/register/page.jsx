'use client';
import { BookOpen, GraduationCap, ArrowRight, School } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

import { cn } from '@/lib/utils';
export default function RegisterPage() {
    const router = useRouter();
    const [selected, setSelected] = useState(null);
    const [schoolCode, setSchoolCode] = useState('');
    const [error, setError] = useState('');
    const handleContinue = () => {
        if (selected === 'teacher') {
            router.push('/start');
            return;
        }
        const code = schoolCode.trim().toLowerCase();
        if (!code) {
            setError('Enter your school code to continue.');
            return;
        }
        router.push(`/join/${encodeURIComponent(code)}`);
    };
    const options = [
        {
            value: 'teacher',
            label: 'Teacher / Admin',
            description: 'Set up your school and create courses',
            icon: BookOpen,
        },
        {
            value: 'student',
            label: 'Student / Parent',
            description: 'Join your school with an invite code',
            icon: GraduationCap,
        },
    ];
    return (<div className="animate-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Get started</h1>
        <p className="text-muted-foreground mt-1.5 text-sm">
          Choose how you'd like to use EduAI.
        </p>
      </div>

      <div className="space-y-3 mb-5">
        {options.map(({ value, label, description, icon: Icon }) => (<button key={value} type="button" onClick={() => { setSelected(value); setError(''); }} className={cn('w-full flex items-center gap-4 p-4 rounded-lg border text-left transition-all', selected === value
                ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                : 'border-input hover:border-primary/50 hover:bg-accent')}>
            <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center shrink-0', selected === value ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>
              <Icon className="h-5 w-5"/>
            </div>
            <div>
              <p className={cn('text-sm font-semibold', selected === value ? 'text-primary' : 'text-foreground')}>
                {label}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
            </div>
          </button>))}
      </div>

      {selected === 'student' && (<div className="mb-4">
          <label className="block text-sm font-medium text-foreground mb-1.5">
            School code
          </label>
          <div className="relative">
            <School className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
            <input type="text" value={schoolCode} onChange={(e) => { setSchoolCode(e.target.value); setError(''); }} onKeyDown={(e) => e.key === 'Enter' && handleContinue()} placeholder="e.g. lincoln-high-school" className={cn('flex h-10 w-full rounded-md border bg-background px-3 py-2 pl-10 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors', error ? 'border-destructive' : 'border-input')}/>
          </div>
          {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
          <p className="mt-1.5 text-xs text-muted-foreground">
            Ask your teacher for the school code or use their invite link directly.
          </p>
        </div>)}

      <button type="button" disabled={!selected} onClick={handleContinue} className="w-full flex items-center justify-center gap-2 h-10 bg-primary text-primary-foreground rounded-md text-sm font-semibold hover:bg-primary/90 disabled:opacity-40 transition-colors">
        Continue <ArrowRight className="h-4 w-4"/>
      </button>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="text-primary font-medium hover:underline">Sign in</Link>
      </p>
    </div>);
}
