'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, ArrowLeft, CheckCircle, ArrowRight, School, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/useToast';
import { apiGet } from '@/lib/api';
import { parseErrorMessage, cn } from '@/lib/utils';

const forgotSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  schoolCode: z.string().optional(),
});

type ForgotFormData = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [showSchoolCode, setShowSchoolCode] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotFormData>({
    resolver: zodResolver(forgotSchema),
  });

  const onSubmit = async (data: ForgotFormData) => {
    setIsLoading(true);
    try {
      let tenantId: string | undefined;
      if (data.schoolCode?.trim()) {
        try {
          const tenant = await apiGet<{ id: string }>(`/auth/tenant/lookup?slug=${encodeURIComponent(data.schoolCode.trim().toLowerCase())}`);
          tenantId = tenant.id;
        } catch {
          toast.error('School not found', `No school with code "${data.schoolCode}" exists.`);
          setIsLoading(false);
          return;
        }
      }
      await forgotPassword(data.email, tenantId);
      setSubmittedEmail(data.email);
      setSubmitted(true);
    } catch (error) {
      const message = parseErrorMessage(error);
      setSubmittedEmail(data.email);
      setSubmitted(true);
      void message;
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="animate-in text-center">
        <div className="mb-6 flex justify-center">
          <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-3">
          Check your email
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed mb-2">
          If an account exists for{' '}
          <span className="font-semibold text-foreground">{submittedEmail}</span>
          , we&apos;ve sent a password reset link.
        </p>
        <p className="text-muted-foreground text-xs mb-8">
          Didn&apos;t receive it? Check your spam folder or try again in a few
          minutes.
        </p>
        <div className="space-y-3">
          <button
            onClick={() => {
              setSubmitted(false);
              setSubmittedEmail('');
            }}
            className="w-full h-10 border border-input rounded-md text-sm font-medium text-foreground bg-background hover:bg-accent transition-colors"
          >
            Try a different email
          </button>
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 w-full h-10 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in">
      <div className="mb-8">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to sign in
        </Link>
        <h1 className="text-2xl font-bold text-foreground">
          Forgot your password?
        </h1>
        <p className="text-muted-foreground mt-1.5 text-sm">
          No worries — we&apos;ll send you reset instructions by email.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">
            Email address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              {...register('email')}
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@school.edu"
              className={cn(
                'flex h-10 w-full rounded-md border bg-background px-3 py-2 pl-10 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors',
                errors.email ? 'border-destructive' : 'border-input'
              )}
            />
          </div>
          {errors.email && <p className="mt-1.5 text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div>
          <button
            type="button"
            onClick={() => setShowSchoolCode(!showSchoolCode)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', showSchoolCode && 'rotate-180')} />
            {showSchoolCode ? 'Hide school code' : 'Enter school code (optional)'}
          </button>
          {showSchoolCode && (
            <div className="mt-2 relative">
              <School className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                {...register('schoolCode')}
                type="text"
                placeholder="e.g. demo-school"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-10 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
              />
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 h-10 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 transition-colors"
        >
          {isLoading ? (
            <>
              <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Sending reset link...
            </>
          ) : (
            <>
              Send reset link
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
