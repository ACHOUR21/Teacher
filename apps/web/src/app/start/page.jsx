'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { BookOpen, Building2, GraduationCap, ArrowRight, ArrowLeft, CheckCircle2, Eye, EyeOff, Sparkles, } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { toast } from '@/hooks/useToast';
import { apiPost } from '@/lib/api';
import { cn, parseErrorMessage } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
// ── Schemas ──────────────────────────────────────────────────────────────────
const schoolSchema = z.object({
    tenantName: z.string().min(2, 'School name must be at least 2 characters').max(200),
    tenantSlug: z
        .string()
        .min(2, 'URL must be at least 2 characters')
        .max(100)
        .regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens'),
    tenantType: z.enum(['SCHOOL', 'UNIVERSITY', 'TRAINING_CENTER', 'TUTORING_CENTER', 'CORPORATE']),
});
const adminSchema = z
    .object({
    firstName: z.string().min(1, 'Required').max(50),
    lastName: z.string().min(1, 'Required').max(50),
    email: z.string().email('Valid email required'),
    password: z
        .string()
        .min(8, 'At least 8 characters')
        .regex(/[A-Z]/, 'Must include uppercase letter')
        .regex(/[0-9]/, 'Must include a number')
        .regex(/[@$!%*?&]/, 'Must include a special character'),
    confirmPassword: z.string(),
})
    .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
});
const TENANT_TYPES = [
    { value: 'SCHOOL', label: 'K-12 School', icon: BookOpen, desc: 'Primary & secondary education' },
    { value: 'UNIVERSITY', label: 'University', icon: GraduationCap, desc: 'Higher education institution' },
    { value: 'TRAINING_CENTER', label: 'Training Center', icon: Sparkles, desc: 'Professional skills training' },
    { value: 'CORPORATE', label: 'Corporate', icon: Building2, desc: 'Employee learning & development' },
];
const STEPS = ['Your Institution', 'Admin Account', 'You\'re Ready!'];
// ── Component ─────────────────────────────────────────────────────────────────
export default function StartPage() {
    const router = useRouter();
    const { login } = useAuthStore();
    const [step, setStep] = useState(0);
    const [schoolData, setSchoolData] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPw, setShowPw] = useState(false);
    const [showConfirmPw, setShowConfirmPw] = useState(false);
    // Step 1 form
    const schoolForm = useForm({
        resolver: zodResolver(schoolSchema),
        defaultValues: { tenantType: 'SCHOOL' },
    });
    // Step 2 form
    const adminForm = useForm({ resolver: zodResolver(adminSchema) });
    // Auto-generate slug from name
    const watchName = schoolForm.watch('tenantName');
    React.useEffect(() => {
        if (watchName && !schoolForm.getValues('tenantSlug')) {
            const slug = watchName
                .toLowerCase()
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .slice(0, 60);
            schoolForm.setValue('tenantSlug', slug);
        }
    }, [watchName, schoolForm]);
    const onSchoolSubmit = (data) => {
        setSchoolData(data);
        setStep(1);
    };
    const onAdminSubmit = async (admin) => {
        if (!schoolData) {
            return;
        }
        setIsSubmitting(true);
        try {
            const result = await apiPost('/auth/tenant/register', {
                tenantName: schoolData.tenantName,
                tenantSlug: schoolData.tenantSlug,
                tenantType: schoolData.tenantType,
                firstName: admin.firstName,
                lastName: admin.lastName,
                email: admin.email,
                password: admin.password,
            });
            login(result.user, result.tokens.accessToken, result.tokens.refreshToken ?? '');
            // Small delay so auth store persists before redirect
            setTimeout(() => router.push('/onboarding'), 300);
            setStep(2);
        }
        catch (err) {
            toast.error('Registration failed', parseErrorMessage(err));
        }
        finally {
            setIsSubmitting(false);
        }
    };
    return (<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-white"/>
          </div>
          <span className="text-xl font-bold text-gray-900">EduAI Ultimate</span>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((label, i) => (<React.Fragment key={i}>
              <div className="flex items-center gap-2">
                <div className={cn('h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all', i < step ? 'bg-green-500 text-white' :
                i === step ? 'bg-blue-600 text-white' :
                    'bg-gray-200 text-gray-500')}>
                  {i < step ? <CheckCircle2 className="h-4 w-4"/> : i + 1}
                </div>
                <span className={cn('text-sm hidden sm:block', i === step ? 'text-gray-900 font-medium' : 'text-gray-400')}>{label}</span>
              </div>
              {i < STEPS.length - 1 && (<div className={cn('flex-1 h-0.5 transition-all', i < step ? 'bg-green-400' : 'bg-gray-200')}/>)}
            </React.Fragment>))}
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">

          {/* ── Step 0: School ── */}
          {step === 0 && (<form onSubmit={schoolForm.handleSubmit(onSchoolSubmit)} className="space-y-5">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Set up your institution</h1>
                <p className="text-sm text-gray-500 mt-1">You can always change this later in settings.</p>
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type of institution</label>
                <div className="grid grid-cols-2 gap-2">
                  {TENANT_TYPES.map(({ value, label, icon: Icon, desc }) => {
                const selected = schoolForm.watch('tenantType') === value;
                return (<button key={value} type="button" onClick={() => schoolForm.setValue('tenantType', value)} className={cn('flex items-start gap-3 p-3 rounded-xl border text-left transition-all', selected
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-600 hover:border-blue-300 hover:bg-blue-50/50')}>
                        <Icon className={cn('h-4 w-4 mt-0.5 shrink-0', selected ? 'text-blue-600' : 'text-gray-400')}/>
                        <div>
                          <div className="text-xs font-semibold">{label}</div>
                          <div className="text-[10px] text-gray-400 mt-0.5">{desc}</div>
                        </div>
                      </button>);
            })}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Institution name</label>
                <input {...schoolForm.register('tenantName')} placeholder="e.g. Greenwood Academy" className={cn('w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500', schoolForm.formState.errors.tenantName ? 'border-red-400' : 'border-gray-200')}/>
                {schoolForm.formState.errors.tenantName && (<p className="mt-1 text-xs text-red-500">{schoolForm.formState.errors.tenantName.message}</p>)}
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Your URL</label>
                <div className="flex items-center border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 border-gray-200">
                  <span className="px-3 py-2 text-sm text-gray-400 bg-gray-50 border-r border-gray-200 whitespace-nowrap">eduai.app/</span>
                  <input {...schoolForm.register('tenantSlug')} placeholder="greenwood-academy" className="flex-1 px-3 py-2 text-sm focus:outline-none"/>
                </div>
                {schoolForm.formState.errors.tenantSlug && (<p className="mt-1 text-xs text-red-500">{schoolForm.formState.errors.tenantSlug.message}</p>)}
              </div>

              <button type="submit" className="w-full flex items-center justify-center gap-2 h-11 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors">
                Continue <ArrowRight className="h-4 w-4"/>
              </button>
            </form>)}

          {/* ── Step 1: Admin Account ── */}
          {step === 1 && (<form onSubmit={adminForm.handleSubmit(onAdminSubmit)} className="space-y-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Create your admin account</h1>
                <p className="text-sm text-gray-500 mt-1">You'll use this to manage <strong>{schoolData?.tenantName}</strong>.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">First name</label>
                  <input {...adminForm.register('firstName')} placeholder="Jane" className={cn('w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500', adminForm.formState.errors.firstName ? 'border-red-400' : 'border-gray-200')}/>
                  {adminForm.formState.errors.firstName && (<p className="mt-1 text-xs text-red-500">{adminForm.formState.errors.firstName.message}</p>)}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Last name</label>
                  <input {...adminForm.register('lastName')} placeholder="Smith" className={cn('w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500', adminForm.formState.errors.lastName ? 'border-red-400' : 'border-gray-200')}/>
                  {adminForm.formState.errors.lastName && (<p className="mt-1 text-xs text-red-500">{adminForm.formState.errors.lastName.message}</p>)}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Work email</label>
                <input {...adminForm.register('email')} type="email" placeholder="jane@greenwood.edu" className={cn('w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500', adminForm.formState.errors.email ? 'border-red-400' : 'border-gray-200')}/>
                {adminForm.formState.errors.email && (<p className="mt-1 text-xs text-red-500">{adminForm.formState.errors.email.message}</p>)}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <input {...adminForm.register('password')} type={showPw ? 'text' : 'password'} placeholder="Min 8 chars, uppercase, number, symbol" className={cn('w-full px-3 py-2 pr-10 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500', adminForm.formState.errors.password ? 'border-red-400' : 'border-gray-200')}/>
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPw ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                  </button>
                </div>
                {adminForm.formState.errors.password && (<p className="mt-1 text-xs text-red-500">{adminForm.formState.errors.password.message}</p>)}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm password</label>
                <div className="relative">
                  <input {...adminForm.register('confirmPassword')} type={showConfirmPw ? 'text' : 'password'} placeholder="Repeat password" className={cn('w-full px-3 py-2 pr-10 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500', adminForm.formState.errors.confirmPassword ? 'border-red-400' : 'border-gray-200')}/>
                  <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showConfirmPw ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                  </button>
                </div>
                {adminForm.formState.errors.confirmPassword && (<p className="mt-1 text-xs text-red-500">{adminForm.formState.errors.confirmPassword.message}</p>)}
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setStep(0)} className="flex items-center gap-1.5 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                  <ArrowLeft className="h-3.5 w-3.5"/> Back
                </button>
                <button type="submit" disabled={isSubmitting} className="flex-1 flex items-center justify-center gap-2 h-11 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 disabled:opacity-60 transition-colors">
                  {isSubmitting ? (<><svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg> Creating...</>) : (<> Launch Platform <ArrowRight className="h-4 w-4"/></>)}
                </button>
              </div>
            </form>)}

          {/* ── Step 2: Success ── */}
          {step === 2 && (<div className="text-center space-y-6">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-8 w-8 text-green-600"/>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">You're all set! 🎉</h1>
                <p className="text-sm text-gray-500 mt-2">
                  <strong>{schoolData?.tenantName}</strong> is ready. Start by creating your first course or invite teachers.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 text-left">
                {[
                { icon: BookOpen, title: 'Create your first course', desc: 'Add lessons, quizzes, and AI-generated content', href: '/courses/new' },
                { icon: GraduationCap, title: 'Invite students', desc: 'Share your school link to let students enroll', href: '/users' },
                { icon: Sparkles, title: 'Try the AI Tutor', desc: 'See how AI personalizes learning for every student', href: '/ai-tutor' },
            ].map((item) => (<Link key={item.href} href={item.href} className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all group">
                    <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                      <item.icon className="h-5 w-5 text-blue-600"/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-700">{item.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-blue-500 shrink-0"/>
                  </Link>))}
              </div>

              <button onClick={() => router.push('/')} className="w-full h-11 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors">
                Go to Dashboard
              </button>
            </div>)}
        </div>

        <p className="text-center text-sm text-gray-400 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-600 hover:underline font-medium">Sign in</Link>
        </p>
      </div>
    </div>);
}
