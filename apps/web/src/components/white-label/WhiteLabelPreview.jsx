'use client';
import { Monitor, Tablet, Smartphone, LayoutDashboard, BookOpen, LogIn, Copy, CheckCheck, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

import { useContrastRatio } from './useContrastRatio';

import { cn } from '@/lib/utils';
// ─── Device config ────────────────────────────────────────────────────────────
const DEVICES = [
    { id: 'desktop', label: 'Desktop', icon: Monitor, maxWidth: 9999 },
    { id: 'tablet', label: 'Tablet', icon: Tablet, maxWidth: 640 },
    { id: 'mobile', label: 'Mobile', icon: Smartphone, maxWidth: 375 },
];
const SCENES = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'courses', label: 'Courses', icon: BookOpen },
    { id: 'login', label: 'Login', icon: LogIn },
];
// ─── Sub-scenes ───────────────────────────────────────────────────────────────
function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    }
    catch {
        return false;
    }
}
function LogoOrPlaceholder({ url, className }) {
    if (url && isValidUrl(url)) {
        return (<img src={url} alt="logo" className={cn('object-contain', className)} onError={e => { e.target.style.display = 'none'; }}/>);
    }
    return <div className={cn('rounded bg-white/30', className)}/>;
}
function DashboardScene({ v }) {
    return (<div className="flex" style={{ minHeight: 240 }}>
      {/* Sidebar */}
      <div className="w-28 shrink-0 bg-gray-50 border-r border-gray-100 p-3 space-y-1.5">
        {['Dashboard', 'Courses', 'Students', 'Grades', 'Reports'].map((item, i) => (<div key={item} className="rounded px-2 py-1.5 text-[11px] font-medium" style={i === 0 ? { backgroundColor: v.secondaryColor, color: '#fff' } : { color: '#6b7280' }}>
            {item}
          </div>))}
      </div>

      {/* Main */}
      <div className="flex-1 p-4 bg-white space-y-3 overflow-hidden">
        <p className="text-[11px] font-semibold text-gray-700">Overview</p>
        <div className="grid grid-cols-3 gap-2">
          {[['24', 'Courses'], ['142', 'Students'], ['98%', 'Pass Rate']].map(([val, lbl]) => (<div key={lbl} className="rounded-lg border border-gray-100 p-2 text-center">
              <div className="text-sm font-bold" style={{ color: v.primaryColor }}>{val}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">{lbl}</div>
            </div>))}
        </div>
        <div className="flex gap-2">
          <div className="rounded-md px-3 py-1.5 text-[11px] font-medium text-white" style={{ backgroundColor: v.primaryColor }}>
            Primary action
          </div>
          <div className="rounded-md px-3 py-1.5 text-[11px] font-medium text-white" style={{ backgroundColor: v.secondaryColor }}>
            Secondary
          </div>
        </div>
        <div className="space-y-1.5 pt-1">
          <div className="h-2 bg-gray-100 rounded w-3/4"/>
          <div className="h-2 bg-gray-100 rounded w-1/2"/>
          <div className="h-2 bg-gray-100 rounded w-2/3"/>
        </div>
      </div>
    </div>);
}
function CoursesScene({ v }) {
    const cards = [
        { title: 'Intro to Algebra', level: 'Beginner', students: 34 },
        { title: 'World History', level: 'Intermediate', students: 28 },
        { title: 'Python Basics', level: 'Beginner', students: 51 },
    ];
    return (<div className="p-4 bg-white space-y-3" style={{ minHeight: 240 }}>
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold text-gray-700">Course Catalogue</p>
        <div className="rounded-md px-2.5 py-1 text-[10px] font-medium text-white" style={{ backgroundColor: v.primaryColor }}>
          + New Course
        </div>
      </div>
      <div className="space-y-2">
        {cards.map(c => (<div key={c.title} className="rounded-lg border border-gray-100 p-2.5 flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg flex-shrink-0" style={{ backgroundColor: v.primaryColor + '22' }}>
              <div className="h-full w-full rounded-lg" style={{ backgroundColor: v.primaryColor, opacity: 0.3 }}/>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-medium text-gray-800 truncate">{c.title}</div>
              <div className="text-[10px] text-gray-400">{c.level} · {c.students} students</div>
            </div>
            <div className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ backgroundColor: v.secondaryColor + '22', color: v.secondaryColor }}>
              View
            </div>
          </div>))}
      </div>
    </div>);
}
function LoginScene({ v }) {
    return (<div className="p-6 bg-gray-50 flex items-center justify-center" style={{ minHeight: 240 }}>
      <div className="w-full max-w-[200px] bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-3">
        <div className="flex flex-col items-center gap-1.5 mb-1">
          <LogoOrPlaceholder url={v.logoUrl} className="h-8 w-8"/>
          <span className="text-[11px] font-semibold text-gray-800">{v.brandName || 'Your Brand'}</span>
          <span className="text-[10px] text-gray-400">Sign in to continue</span>
        </div>
        <div className="space-y-2">
          <div className="h-7 rounded-lg border border-gray-200 bg-gray-50 text-[10px] text-gray-300 flex items-center px-2">
            Email address
          </div>
          <div className="h-7 rounded-lg border border-gray-200 bg-gray-50 text-[10px] text-gray-300 flex items-center px-2">
            Password
          </div>
        </div>
        <div className="w-full rounded-lg py-1.5 text-center text-[11px] font-medium text-white" style={{ backgroundColor: v.primaryColor }}>
          Sign In
        </div>
        <div className="text-center text-[10px]" style={{ color: v.secondaryColor }}>
          Forgot password?
        </div>
      </div>
    </div>);
}
// ─── Contrast warning badge ───────────────────────────────────────────────────
function ContrastBadge({ color, label }) {
    const { ratio, level } = useContrastRatio(color, '#ffffff');
    if (level === 'fail') {
        return (<span className="inline-flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">
        <AlertTriangle className="h-2.5 w-2.5"/>
        {label}: {ratio.toFixed(1)}:1 — low contrast
      </span>);
    }
    return null;
}
// ─── CSS output panel ─────────────────────────────────────────────────────────
function CssOutput({ v, onCopy }) {
    const [copied, setCopied] = useState(false);
    const css = `:root {\n  --color-primary: ${v.primaryColor};\n  --color-secondary: ${v.secondaryColor};\n}${v.customCss ? `\n\n/* Custom CSS */\n${v.customCss}` : ''}`;
    async function copy() {
        await navigator.clipboard.writeText(css);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        onCopy();
    }
    return (<div className="relative rounded-lg bg-gray-900 text-gray-100 text-[10px] font-mono p-3 overflow-auto max-h-32">
      <button onClick={copy} className="absolute top-2 right-2 p-1 rounded hover:bg-white/10 transition-colors" title="Copy CSS">
        {copied ? <CheckCheck className="h-3 w-3 text-green-400"/> : <Copy className="h-3 w-3 text-gray-400"/>}
      </button>
      <pre className="whitespace-pre-wrap pr-5">{css}</pre>
    </div>);
}
export function WhiteLabelPreview({ values: v }) {
    const [device, setDevice] = useState('desktop');
    const [scene, setScene] = useState('dashboard');
    const [showCss, setShowCss] = useState(false);
    const selectedDevice = DEVICES.find(d => d.id === device);
    return (<div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        {/* Device toggle */}
        <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
          {DEVICES.map(d => {
            const Icon = d.icon;
            return (<button key={d.id} onClick={() => setDevice(d.id)} title={d.label} className={cn('p-1.5 rounded-md transition-colors', device === d.id ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600')}>
                <Icon className="h-3.5 w-3.5"/>
              </button>);
        })}
        </div>

        {/* Scene toggle */}
        <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
          {SCENES.map(s => {
            const Icon = s.icon;
            return (<button key={s.id} onClick={() => setScene(s.id)} className={cn('flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors', scene === s.id ? 'bg-white shadow-sm text-gray-900 font-medium' : 'text-gray-400 hover:text-gray-600')}>
                <Icon className="h-3 w-3"/>
                {s.label}
              </button>);
        })}
        </div>
      </div>

      {/* Preview frame */}
      <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm transition-all duration-300" style={{ maxWidth: selectedDevice.maxWidth === 9999 ? '100%' : selectedDevice.maxWidth }}>
        {/* Top nav */}
        <div className="flex items-center gap-2.5 px-4 py-2.5" style={{ backgroundColor: v.primaryColor }}>
          <LogoOrPlaceholder url={v.logoUrl} className="h-5 w-5"/>
          <span className="text-white font-semibold text-xs truncate">
            {v.brandName || 'Your Brand'}
          </span>
          <div className="ml-auto flex gap-1.5">
            <div className="h-1.5 w-8 rounded-full bg-white/40"/>
            <div className="h-1.5 w-8 rounded-full bg-white/40"/>
            <div className="h-1.5 w-5 rounded-full bg-white/40"/>
          </div>
        </div>

        {/* Scene */}
        {scene === 'dashboard' && <DashboardScene v={v}/>}
        {scene === 'courses' && <CoursesScene v={v}/>}
        {scene === 'login' && <LoginScene v={v}/>}

        {/* Footer */}
        <div className="px-4 py-1.5 text-[10px] text-white/80 text-center" style={{ backgroundColor: v.secondaryColor }}>
          {v.customDomain || 'app.yourschool.com'} &middot; Powered by EduAI
        </div>
      </div>

      {/* Color chips + contrast warnings */}
      <div className="space-y-1.5">
        <div className="flex gap-3">
          {[{ color: v.primaryColor, label: 'Primary' }, { color: v.secondaryColor, label: 'Secondary' }].map(({ color, label }) => (<div key={label} className="flex items-center gap-1.5">
              <div className="h-4 w-4 rounded-full border border-gray-200 shadow-sm flex-shrink-0" style={{ backgroundColor: color }}/>
              <span className="text-[10px] text-gray-500 font-mono">{color}</span>
            </div>))}
        </div>
        <div className="flex flex-wrap gap-1">
          <ContrastBadge color={v.primaryColor} label="Primary"/>
          <ContrastBadge color={v.secondaryColor} label="Secondary"/>
        </div>
      </div>

      {/* Generated CSS toggle */}
      <div>
        <button onClick={() => setShowCss(s => !s)} className="text-xs text-blue-600 hover:underline">
          {showCss ? 'Hide' : 'Show'} generated CSS
        </button>
        {showCss && (<div className="mt-2">
            <CssOutput v={v} onCopy={() => { }}/>
          </div>)}
      </div>
    </div>);
}
