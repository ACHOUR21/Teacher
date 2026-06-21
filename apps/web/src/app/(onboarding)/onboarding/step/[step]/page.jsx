'use client';
import { ArrowRight, BookOpen, Building2, CheckCircle2, Palette, SkipForward, Sparkles, UserPlus, Users, } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

import { completeOnboarding, createFirstCourse, sendInvites, } from '../../onboarding-actions';
import { useOnboardingStore } from '../../onboarding-store';

import { OnboardingProgress } from '@/components/onboarding/OnboardingProgress';
import { cn } from '@/lib/utils';
// ── Helpers ────────────────────────────────────────────────────────────────────
function SpinIcon({ className }) {
    return (<svg className={cn('animate-spin', className)} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>);
}
// ── Confetti ──────────────────────────────────────────────────────────────────
function ConfettiPiece({ style, }) {
    return (<div className="absolute w-2 h-2 rounded-sm opacity-0 animate-confetti" style={style}/>);
}
function Confetti() {
    const pieces = Array.from({ length: 40 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        color: ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#EC4899'][i % 6],
        delay: `${Math.random() * 1.5}s`,
        duration: `${1.5 + Math.random() * 1}s`,
    }));
    return (<div className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((p) => (<ConfettiPiece key={p.id} style={{
                left: p.left,
                top: '-8px',
                backgroundColor: p.color,
                animationDelay: p.delay,
                animationDuration: p.duration,
            }}/>))}
    </div>);
}
// ── Step components ────────────────────────────────────────────────────────────
function StepWelcome({ onNext }) {
    return (<div className="text-center space-y-8">
      <div className="space-y-4">
        <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto shadow-lg shadow-blue-200">
          <Sparkles className="h-10 w-10 text-white"/>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome to EduAI!
          </h1>
          <p className="mt-3 text-gray-500 text-lg leading-relaxed max-w-md mx-auto">
            Let&apos;s get your organization set up. It only takes a few
            minutes.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto text-center">
        {[
            { label: '6 steps', sub: 'Quick setup' },
            { label: '5 min', sub: 'Estimated time' },
            { label: '100%', sub: 'Customizable' },
        ].map((item) => (<div key={item.label} className="bg-blue-50 rounded-xl p-3">
            <div className="text-lg font-bold text-blue-700">{item.label}</div>
            <div className="text-xs text-blue-500">{item.sub}</div>
          </div>))}
      </div>

      <button onClick={onNext} className="inline-flex items-center gap-2 px-8 py-3.5 bg-blue-600 text-white rounded-xl text-base font-semibold hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-md shadow-blue-200">
        Get Started <ArrowRight className="h-5 w-5"/>
      </button>
    </div>);
}
// ──────────────────────────────────────────────────────────────────────────────
const ORG_TYPES = ['School', 'University', 'Corporate', 'Other'];
const COUNTRIES = [
    'United States',
    'United Kingdom',
    'Canada',
    'Australia',
    'Germany',
    'France',
    'India',
    'Brazil',
    'Japan',
    'Singapore',
    'Other',
];
const TIMEZONES = [
    'UTC',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Asia/Kolkata',
    'Asia/Singapore',
    'Australia/Sydney',
    'America/Sao_Paulo',
];
function StepOrgProfile({ onNext }) {
    const { orgName, orgType, country, timezone, updateOrg } = useOnboardingStore();
    const [errors, setErrors] = useState({});
    const validate = () => {
        const e = {};
        if (!orgName.trim())
            {e.orgName = 'Organization name is required';}
        if (!orgType)
            {e.orgType = 'Please select an organization type';}
        if (!country)
            {e.country = 'Please select a country';}
        if (!timezone)
            {e.timezone = 'Please select a timezone';}
        setErrors(e);
        return Object.keys(e).length === 0;
    };
    const handleNext = () => {
        if (validate())
            {onNext();}
    };
    const fieldClass = (key) => cn('w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors', errors[key] ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white');
    return (<div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Building2 className="h-6 w-6 text-blue-600"/>
          Organization Profile
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Tell us about your organization so we can personalize the experience.
        </p>
      </div>

      <div className="space-y-4">
        {/* Org name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Organization Name <span className="text-red-500">*</span>
          </label>
          <input type="text" value={orgName} onChange={(e) => {
            updateOrg({ orgName: e.target.value });
            if (errors.orgName)
                {setErrors((p) => ({ ...p, orgName: '' }));}
        }} placeholder="e.g. Riverside Academy" className={fieldClass('orgName')}/>
          {errors.orgName && (<p className="text-xs text-red-500 mt-1">{errors.orgName}</p>)}
        </div>

        {/* Org type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Organization Type <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {ORG_TYPES.map((type) => (<button key={type} type="button" onClick={() => {
                updateOrg({ orgType: type });
                if (errors.orgType)
                    {setErrors((p) => ({ ...p, orgType: '' }));}
            }} className={cn('px-3 py-2 rounded-lg border text-sm font-medium transition-all', orgType === type
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 text-gray-600 hover:border-blue-300 hover:bg-blue-50/40')}>
                {type}
              </button>))}
          </div>
          {errors.orgType && (<p className="text-xs text-red-500 mt-1">{errors.orgType}</p>)}
        </div>

        {/* Country */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Country <span className="text-red-500">*</span>
          </label>
          <select value={country} onChange={(e) => {
            updateOrg({ country: e.target.value });
            if (errors.country)
                {setErrors((p) => ({ ...p, country: '' }));}
        }} className={cn(fieldClass('country'), 'cursor-pointer')}>
            <option value="">Select country…</option>
            {COUNTRIES.map((c) => (<option key={c} value={c}>
                {c}
              </option>))}
          </select>
          {errors.country && (<p className="text-xs text-red-500 mt-1">{errors.country}</p>)}
        </div>

        {/* Timezone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Timezone <span className="text-red-500">*</span>
          </label>
          <select value={timezone} onChange={(e) => {
            updateOrg({ timezone: e.target.value });
            if (errors.timezone)
                {setErrors((p) => ({ ...p, timezone: '' }));}
        }} className={cn(fieldClass('timezone'), 'cursor-pointer')}>
            <option value="">Select timezone…</option>
            {TIMEZONES.map((tz) => (<option key={tz} value={tz}>
                {tz}
              </option>))}
          </select>
          {errors.timezone && (<p className="text-xs text-red-500 mt-1">{errors.timezone}</p>)}
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button onClick={handleNext} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
          Continue <ArrowRight className="h-4 w-4"/>
        </button>
      </div>
    </div>);
}
// ──────────────────────────────────────────────────────────────────────────────
const PRESET_COLORS = [
    '#3B82F6',
    '#8B5CF6',
    '#10B981',
    '#F59E0B',
    '#EF4444',
    '#EC4899',
    '#06B6D4',
    '#6366F1',
];
function StepBranding({ onNext }) {
    const { logoUrl, primaryColor, tagline, updateOrg } = useOnboardingStore();
    const [uploading, setUploading] = useState(false);
    const fileRef = React.useRef(null);
    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file)
            {return;}
        setUploading(true);
        try {
            // In a real implementation, this would upload to storage
            // Here we use a local object URL as a preview placeholder
            const objectUrl = URL.createObjectURL(file);
            updateOrg({ logoUrl: objectUrl });
        }
        finally {
            setUploading(false);
            if (fileRef.current)
                {fileRef.current.value = '';}
        }
    };
    return (<div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Palette className="h-6 w-6 text-blue-600"/>
          Branding
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Customize your organization&apos;s look and feel.
        </p>
      </div>

      <div className="space-y-5">
        {/* Logo upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Organization Logo
          </label>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange}/>
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 overflow-hidden shrink-0">
              {logoUrl ? (<img src={logoUrl} alt="Logo preview" className="h-full w-full object-cover"/>) : (<span className="text-xs text-gray-400 text-center px-1">
                  No logo
                </span>)}
            </div>
            <div className="space-y-2">
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors">
                {uploading ? (<SpinIcon className="h-4 w-4"/>) : null}
                {uploading ? 'Uploading…' : 'Upload Logo'}
              </button>
              {logoUrl && (<button type="button" onClick={() => updateOrg({ logoUrl: null })} className="block text-xs text-red-500 hover:text-red-700 transition-colors">
                  Remove
                </button>)}
              <p className="text-xs text-gray-400">PNG, JPG, SVG up to 2 MB</p>
            </div>
          </div>
        </div>

        {/* Primary color */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Primary Color
          </label>
          <div className="flex items-center gap-3 flex-wrap">
            {PRESET_COLORS.map((color) => (<button key={color} type="button" onClick={() => updateOrg({ primaryColor: color })} className={cn('h-8 w-8 rounded-full border-2 transition-all', primaryColor === color
                ? 'border-gray-900 scale-110 shadow-md'
                : 'border-transparent hover:scale-105')} style={{ backgroundColor: color }} title={color}/>))}
            {/* Custom color picker */}
            <div className="relative">
              <input type="color" value={primaryColor} onChange={(e) => updateOrg({ primaryColor: e.target.value })} className="h-8 w-8 rounded-full cursor-pointer border border-gray-200 p-0.5 bg-transparent" title="Custom color"/>
            </div>
            <span className="text-xs text-gray-500 font-mono">{primaryColor}</span>
          </div>
          {/* Color preview */}
          <div className="mt-3 h-10 rounded-lg flex items-center justify-center text-white text-xs font-semibold" style={{ backgroundColor: primaryColor }}>
            Preview — {primaryColor}
          </div>
        </div>

        {/* Tagline */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Tagline{' '}
            <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input type="text" value={tagline} onChange={(e) => updateOrg({ tagline: e.target.value })} placeholder="e.g. Empowering learners of tomorrow" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" maxLength={120}/>
          <p className="text-xs text-gray-400 mt-1">
            {tagline.length}/120 characters
          </p>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button onClick={onNext} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
          Continue <ArrowRight className="h-4 w-4"/>
        </button>
      </div>
    </div>);
}
// ──────────────────────────────────────────────────────────────────────────────
function StepInviteTeam({ onNext }) {
    const { inviteEmails, updateOrg } = useOnboardingStore();
    const [emails, setEmails] = useState(inviteEmails.length > 0 ? inviteEmails : ['']);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState([]);
    const isValidEmail = (email) => email === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const addEmail = () => {
        if (emails.length < 5)
            {setEmails((p) => [...p, '']);}
    };
    const updateEmail = (index, value) => {
        setEmails((p) => p.map((e, i) => (i === index ? value : e)));
        setErrors((p) => p.map((e, i) => (i === index ? '' : e)));
    };
    const removeEmail = (index) => {
        setEmails((p) => p.filter((_, i) => i !== index));
        setErrors((p) => p.filter((_, i) => i !== index));
    };
    const handleNext = async () => {
        const newErrors = emails.map((e) => e.trim() && !isValidEmail(e) ? 'Invalid email address' : '');
        if (newErrors.some(Boolean)) {
            setErrors(newErrors);
            return;
        }
        const valid = emails.filter((e) => e.trim());
        updateOrg({ inviteEmails: valid });
        if (valid.length > 0) {
            setLoading(true);
            try {
                await sendInvites(valid);
            }
            catch {
                // Non-blocking — proceed even if invite API fails
            }
            finally {
                setLoading(false);
            }
        }
        onNext();
    };
    return (<div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Users className="h-6 w-6 text-blue-600"/>
          Invite Team
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Add admin colleagues to help manage the platform. You can invite up to
          5 people now.
        </p>
      </div>

      <div className="space-y-3">
        {emails.map((email, i) => (<div key={i} className="flex items-center gap-2">
            <div className="flex-1">
              <input type="email" value={email} onChange={(e) => updateEmail(i, e.target.value)} placeholder={`admin${i + 1}@organization.com`} className={cn('w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors', errors[i]
                ? 'border-red-300 bg-red-50'
                : 'border-gray-200 bg-white')}/>
              {errors[i] && (<p className="text-xs text-red-500 mt-0.5">{errors[i]}</p>)}
            </div>
            {emails.length > 1 && (<button type="button" onClick={() => removeEmail(i)} className="h-9 w-9 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0" title="Remove">
                &times;
              </button>)}
          </div>))}

        {emails.length < 5 && (<button type="button" onClick={addEmail} className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors">
            <UserPlus className="h-4 w-4"/> Add another
          </button>)}
      </div>

      <div className="flex items-center justify-between pt-2">
        <button onClick={onNext} disabled={loading} className="flex items-center gap-1.5 px-4 py-2.5 text-gray-500 text-sm hover:text-gray-700 transition-colors">
          <SkipForward className="h-4 w-4"/> Skip for now
        </button>
        <button onClick={handleNext} disabled={loading} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors">
          {loading ? (<SpinIcon className="h-4 w-4"/>) : (<ArrowRight className="h-4 w-4"/>)}
          {loading ? 'Sending…' : 'Send Invites'}
        </button>
      </div>
    </div>);
}
// ──────────────────────────────────────────────────────────────────────────────
function StepFirstCourse({ onNext }) {
    const { firstCourseTitle, firstCourseDescription, updateOrg } = useOnboardingStore();
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const handleCreate = async () => {
        if (!firstCourseTitle.trim()) {
            setErrors({ title: 'Course title is required' });
            return;
        }
        setLoading(true);
        try {
            await createFirstCourse(firstCourseTitle, firstCourseDescription);
        }
        catch {
            // Non-blocking — proceed even if course creation fails
        }
        finally {
            setLoading(false);
        }
        onNext();
    };
    const handleSkip = () => {
        updateOrg({ firstCourseTitle: '', firstCourseDescription: '' });
        onNext();
    };
    return (<div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-blue-600"/>
          Create Your First Course
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Get started with a course — you can add more content and lessons later.
          This step is optional.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Course Title <span className="text-red-500">*</span>
          </label>
          <input type="text" value={firstCourseTitle} onChange={(e) => {
            updateOrg({ firstCourseTitle: e.target.value });
            if (errors.title)
                {setErrors({});}
        }} placeholder="e.g. Introduction to Mathematics" className={cn('w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors', errors.title
            ? 'border-red-300 bg-red-50'
            : 'border-gray-200 bg-white')}/>
          {errors.title && (<p className="text-xs text-red-500 mt-1">{errors.title}</p>)}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Description{' '}
            <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea rows={3} value={firstCourseDescription} onChange={(e) => updateOrg({ firstCourseDescription: e.target.value })} placeholder="What will students learn in this course?" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"/>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <button onClick={handleSkip} className="flex items-center gap-1.5 px-4 py-2.5 text-gray-500 text-sm hover:text-gray-700 transition-colors">
          <SkipForward className="h-4 w-4"/> Skip for now
        </button>
        <button onClick={handleCreate} disabled={loading} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors">
          {loading ? (<SpinIcon className="h-4 w-4"/>) : (<BookOpen className="h-4 w-4"/>)}
          {loading ? 'Creating…' : 'Create Course'}
        </button>
      </div>
    </div>);
}
// ──────────────────────────────────────────────────────────────────────────────
function StepComplete() {
    const router = useRouter();
    const store = useOnboardingStore();
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    useEffect(() => {
        let cancelled = false;
        const finish = async () => {
            setLoading(true);
            try {
                await completeOnboarding({
                    orgName: store.orgName,
                    orgType: store.orgType,
                    country: store.country,
                    timezone: store.timezone,
                    logoUrl: store.logoUrl,
                    primaryColor: store.primaryColor,
                    tagline: store.tagline,
                });
            }
            catch {
                // Ignore API errors on the completion step
            }
            finally {
                if (!cancelled) {
                    setLoading(false);
                    setDone(true);
                }
            }
        };
        void finish();
        return () => {
            cancelled = true;
        };
        // Only run once on mount
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const summary = [
        store.orgName && { label: 'Organization', value: store.orgName },
        store.orgType && { label: 'Type', value: store.orgType },
        store.country && { label: 'Country', value: store.country },
        store.timezone && { label: 'Timezone', value: store.timezone },
        store.inviteEmails.length > 0 && {
            label: 'Invites sent',
            value: `${store.inviteEmails.length} admin${store.inviteEmails.length === 1 ? '' : 's'}`,
        },
        store.firstCourseTitle && {
            label: 'First course',
            value: store.firstCourseTitle,
        },
    ].filter(Boolean);
    const handleGoDashboard = () => {
        store.reset();
        router.push('/');
    };
    return (<div className="relative text-center space-y-8 overflow-visible">
      {done && <Confetti />}

      <div className="space-y-4">
        <div className="relative">
          <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mx-auto shadow-md">
            {loading ? (<SpinIcon className="h-10 w-10 text-green-600"/>) : (<CheckCircle2 className="h-12 w-12 text-green-500"/>)}
          </div>
        </div>
        <div>
          <h2 className="text-3xl font-bold text-gray-900">
            {loading ? 'Finishing up…' : "You're all set!"}
          </h2>
          <p className="mt-2 text-gray-500 leading-relaxed">
            {loading
            ? 'Saving your organization settings…'
            : "Your organization is ready. Here's a summary of what you've set up."}
          </p>
        </div>
      </div>

      {!loading && summary.length > 0 && (<div className="bg-gray-50 rounded-xl border border-gray-200 divide-y divide-gray-100 text-left">
          {summary.map((item) => (<div key={item.label} className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-gray-500">{item.label}</span>
              <span className="text-sm font-medium text-gray-900">
                {item.value}
              </span>
            </div>))}
        </div>)}

      {!loading && (<button onClick={handleGoDashboard} className="w-full h-12 bg-blue-600 text-white rounded-xl font-semibold text-base hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-md shadow-blue-200">
          Go to Dashboard →
        </button>)}
    </div>);
}
// ── Page ───────────────────────────────────────────────────────────────────────
const TOTAL_STEPS = 6;
export default function OnboardingStepPage() {
    const params = useParams();
    const router = useRouter();
    const { setStep } = useOnboardingStore();
    const currentStep = Math.max(1, Math.min(TOTAL_STEPS, parseInt(params.step ?? '1', 10)));
    useEffect(() => {
        setStep(currentStep);
    }, [currentStep, setStep]);
    const goToStep = (next) => {
        if (next > TOTAL_STEPS)
            {return;}
        router.push(`/onboarding/step/${next}`);
    };
    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return <StepWelcome onNext={() => goToStep(2)}/>;
            case 2:
                return <StepOrgProfile onNext={() => goToStep(3)}/>;
            case 3:
                return <StepBranding onNext={() => goToStep(4)}/>;
            case 4:
                return <StepInviteTeam onNext={() => goToStep(5)}/>;
            case 5:
                return <StepFirstCourse onNext={() => goToStep(6)}/>;
            case 6:
                return <StepComplete />;
            default:
                return null;
        }
    };
    return (<div className="space-y-8">
      {/* Progress indicator */}
      <OnboardingProgress currentStep={currentStep}/>

      {/* Step card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 min-h-[400px]">
        {renderStep()}
      </div>

      {/* Step counter */}
      <p className="text-center text-xs text-gray-400">
        Step {currentStep} of {TOTAL_STEPS}
      </p>
    </div>);
}
