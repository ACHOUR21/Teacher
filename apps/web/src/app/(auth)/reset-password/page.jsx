'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useState, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { toast } from '@/hooks/useToast';
import { apiPost } from '@/lib/api';
import { parseErrorMessage, cn } from '@/lib/utils';
const schema = z
    .object({
    password: z
        .string()
        .min(8, 'At least 8 characters')
        .regex(/[A-Z]/, 'Must include uppercase letter')
        .regex(/[0-9]/, 'Must include a number')
        .regex(/[@$!%*?&]/, 'Must include a special character (@$!%*?&)'),
    confirmPassword: z.string(),
})
    .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
});
function ResetPasswordPageInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const [showPw, setShowPw] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [done, setDone] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(schema),
    });
    if (!token) {
        return (<div className="text-center space-y-4">
        <div className="h-14 w-14 rounded-full bg-red-100 flex items-center justify-center mx-auto">
          <AlertCircle className="h-7 w-7 text-red-500"/>
        </div>
        <h1 className="text-xl font-bold text-gray-900">Invalid reset link</h1>
        <p className="text-sm text-gray-500">This password reset link is missing or invalid.</p>
        <Link href="/forgot-password" className="text-sm text-blue-600 font-medium hover:underline">
          Request a new one →
        </Link>
      </div>);
    }
    if (done) {
        return (<div className="text-center space-y-4">
        <div className="h-14 w-14 rounded-full bg-green-100 flex items-center justify-center mx-auto">
          <CheckCircle2 className="h-7 w-7 text-green-600"/>
        </div>
        <h1 className="text-xl font-bold text-gray-900">Password updated!</h1>
        <p className="text-sm text-gray-500">Your password has been reset successfully.</p>
        <button onClick={() => router.push('/login')} className="w-full h-10 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
          Sign in now
        </button>
      </div>);
    }
    const onSubmit = async (data) => {
        setIsSubmitting(true);
        try {
            await apiPost('/auth/reset-password', { token, newPassword: data.password });
            setDone(true);
        }
        catch (err) {
            toast.error('Reset failed', parseErrorMessage(err));
        }
        finally {
            setIsSubmitting(false);
        }
    };
    return (<div className="animate-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Set new password</h1>
        <p className="text-muted-foreground mt-1.5 text-sm">
          Choose a strong password you haven't used before.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">New password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
            <input {...register('password')} type={showPw ? 'text' : 'password'} autoComplete="new-password" placeholder="Min 8 chars, uppercase, number, symbol" className={cn('flex h-10 w-full rounded-md border bg-background px-3 py-2 pl-10 pr-10 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors', errors.password ? 'border-destructive' : 'border-input')}/>
            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showPw ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
            </button>
          </div>
          {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Confirm password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
            <input {...register('confirmPassword')} type={showConfirm ? 'text' : 'password'} autoComplete="new-password" placeholder="Repeat password" className={cn('flex h-10 w-full rounded-md border bg-background px-3 py-2 pl-10 pr-10 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors', errors.confirmPassword ? 'border-destructive' : 'border-input')}/>
            <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showConfirm ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
            </button>
          </div>
          {errors.confirmPassword && <p className="mt-1 text-xs text-destructive">{errors.confirmPassword.message}</p>}
        </div>

        <button type="submit" disabled={isSubmitting} className="w-full flex items-center justify-center gap-2 h-10 bg-primary text-primary-foreground rounded-md text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors">
          {isSubmitting ? (<><svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg> Resetting…</>) : 'Reset Password'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Remembered your password?{' '}
        <Link href="/login" className="text-primary font-medium hover:underline">Sign in</Link>
      </p>
    </div>);
}
export default function ResetPasswordPage() {
    return (<Suspense>
      <ResetPasswordPageInner />
    </Suspense>);
}
