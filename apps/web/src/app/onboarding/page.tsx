'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  BookOpen, Building2, CheckCircle2, ChevronRight, Copy, Check,
  Globe, Image, ArrowRight, SkipForward, Sparkles, Users,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { cn } from '@/lib/utils';

const STEPS = [
  { id: 0, label: 'School Profile', icon: Building2 },
  { id: 1, label: 'Invite Link', icon: Users },
  { id: 2, label: 'First Course', icon: BookOpen },
  { id: 3, label: 'Done', icon: CheckCircle2 },
];

const CATEGORIES = ['Mathematics', 'Science', 'History', 'Language', 'Technology', 'Arts', 'Business', 'Other'];

export default function OnboardingPage() {
  const router = useRouter();
  const user = useAuthStore(s => s.user);
  const [step, setStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // Profile step state
  const [logoUrl, setLogoUrl] = useState('');
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Course step state
  const [courseTitle, setCourseTitle] = useState('');
  const [courseCategory, setCourseCategory] = useState('');
  const [courseLevel, setCourseLevel] = useState('BEGINNER');
  const [creatingCourse, setCreatingCourse] = useState(false);

  // Copy invite link
  const [copied, setCopied] = useState(false);
  const joinUrl = typeof window !== 'undefined' && user?.tenantSlug
    ? `${window.location.origin}/join/${user.tenantSlug}`
    : '';

  // Load existing status
  const { data: status } = useQuery({
    queryKey: ['onboarding-status'],
    queryFn: () => api.get('/tenants/me/onboarding').then(r => r.data.data),
    enabled: !!user,
  });

  useEffect(() => {
    if (status) {
      if (status.completed) { router.replace('/'); return; }
      setCompletedSteps(status.completedSteps ?? []);
      if ((status.completedSteps?.length ?? 0) > 0) {
        setStep(Math.min(status.completedSteps.length, STEPS.length - 1));
      }
      if (status.logoUrl) setLogoUrl(status.logoUrl);
    }
  }, [status, router]);

  const saveProgress = async (newCompleted: number[], done = false) => {
    await api.patch('/tenants/me/onboarding', { completedSteps: newCompleted, completed: done });
  };

  const markStepDone = (stepId: number) => {
    const updated = Array.from(new Set([...completedSteps, stepId]));
    setCompletedSteps(updated);
    return updated;
  };

  // ── Step handlers ──────────────────────────────────────────────────────────

  const handleProfileSave = async () => {
    setSavingProfile(true);
    try {
      await api.patch('/tenants/me/profile', { logoUrl: logoUrl || undefined, description, website });
      const updated = markStepDone(0);
      await saveProgress(updated);
      setStep(1);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleInviteDone = async () => {
    const updated = markStepDone(1);
    await saveProgress(updated);
    setStep(2);
  };

  const handleCourseCreate = async () => {
    if (!courseTitle.trim()) { setStep(3); return; }
    setCreatingCourse(true);
    try {
      await api.post('/courses', {
        title: courseTitle,
        category: courseCategory || 'Other',
        level: courseLevel,
        sections: [],
      });
      const updated = markStepDone(2);
      await saveProgress(updated, true);
      setStep(3);
    } finally {
      setCreatingCourse(false);
    }
  };

  const handleSkipCourse = async () => {
    const updated = markStepDone(2);
    await saveProgress(updated, true);
    setStep(3);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(joinUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">EduAI Ultimate</span>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <React.Fragment key={s.id}>
              <button
                onClick={() => completedSteps.includes(i) || i === step ? setStep(i) : undefined}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                  step === i ? 'bg-blue-600 text-white' :
                  completedSteps.includes(i) ? 'bg-green-100 text-green-700' :
                  'bg-gray-100 text-gray-400'
                )}
              >
                {completedSteps.includes(i) ? <CheckCircle2 className="h-3.5 w-3.5" /> : <s.icon className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline">{s.label}</span>
              </button>
              {i < STEPS.length - 1 && (
                <div className={cn('flex-1 h-px', completedSteps.includes(i) ? 'bg-green-300' : 'bg-gray-200')} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">

          {/* ── Step 0: School Profile ── */}
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Set up your school profile</h2>
                <p className="text-sm text-gray-500 mt-1">This is what students will see when they join.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">School Logo</label>
                <ImageUpload
                  value={logoUrl}
                  onChange={setLogoUrl}
                  folder="logos"
                  label="Upload logo"
                  maxSizeMB={2}
                  aspectRatio="square"
                  className="max-w-[160px]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Tell students about your school..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <Globe className="inline h-3.5 w-3.5 mr-1" />Website (optional)
                </label>
                <input
                  type="url"
                  value={website}
                  onChange={e => setWebsite(e.target.value)}
                  placeholder="https://yourschool.com"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleProfileSave}
                  disabled={savingProfile}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {savingProfile ? (
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  ) : <ArrowRight className="h-4 w-4" />}
                  Save & Continue
                </button>
                <button
                  onClick={async () => { const u = markStepDone(0); await saveProgress(u); setStep(1); }}
                  className="flex items-center gap-1 px-4 py-2.5 text-gray-500 text-sm hover:text-gray-700 transition-colors"
                >
                  <SkipForward className="h-3.5 w-3.5" /> Skip
                </button>
              </div>
            </div>
          )}

          {/* ── Step 1: Invite Link ── */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Share your school link</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Students and teachers join by visiting this link.
                </p>
              </div>

              <div className="bg-blue-50 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600 shrink-0" />
                  <p className="text-sm font-medium text-blue-900">Your school's join link</p>
                </div>
                <div className="flex items-center gap-2 bg-white rounded-lg border border-blue-200 px-3 py-2">
                  <span className="flex-1 text-xs text-gray-600 truncate font-mono">{joinUrl || 'Loading…'}</span>
                  <button
                    onClick={copyLink}
                    className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-blue-100 hover:bg-blue-200 text-blue-700 transition-colors shrink-0"
                  >
                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <p className="text-xs text-blue-700">
                  Share this with anyone you want to join your school. They'll choose their role (student or teacher) when they sign up.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleInviteDone}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  <ArrowRight className="h-4 w-4" /> Continue
                </button>
              </div>
            </div>
          )}

          {/* ── Step 2: Create First Course ── */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Create your first course</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Start with something simple — you can add more content later.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Course title *</label>
                <input
                  type="text"
                  value={courseTitle}
                  onChange={e => setCourseTitle(e.target.value)}
                  placeholder="e.g. Introduction to Mathematics"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
                  <select
                    value={courseCategory}
                    onChange={e => setCourseCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select…</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Level</label>
                  <select
                    value={courseLevel}
                    onChange={e => setCourseLevel(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {['BEGINNER', 'INTERMEDIATE', 'ADVANCED'].map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleCourseCreate}
                  disabled={creatingCourse || !courseTitle.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {creatingCourse ? (
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  ) : <BookOpen className="h-4 w-4" />}
                  Create Course
                </button>
                <button
                  onClick={handleSkipCourse}
                  className="flex items-center gap-1 px-4 py-2.5 text-gray-500 text-sm hover:text-gray-700 transition-colors"
                >
                  <SkipForward className="h-3.5 w-3.5" /> Skip for now
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Done ── */}
          {step === 3 && (
            <div className="text-center space-y-6">
              <div>
                <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">You're all set!</h2>
                <p className="text-gray-500 mt-2 text-sm">
                  Your school is ready. Head to the dashboard to explore everything EduAI has to offer.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2 text-left">
                {[
                  { icon: BookOpen, label: 'Manage Courses', href: '/courses' },
                  { icon: Users, label: 'View Students', href: '/users' },
                  { icon: Sparkles, label: 'AI Tutor', href: '/ai-tutor' },
                ].map(item => (
                  <a key={item.href} href={item.href}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all group">
                    <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                      <item.icon className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-800 group-hover:text-blue-700">{item.label}</span>
                    <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-blue-500 ml-auto" />
                  </a>
                ))}
              </div>

              <button
                onClick={() => router.push('/')}
                className="w-full h-11 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors"
              >
                Go to Dashboard →
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Step {Math.min(step + 1, STEPS.length)} of {STEPS.length}
        </p>
      </div>
    </div>
  );
}
