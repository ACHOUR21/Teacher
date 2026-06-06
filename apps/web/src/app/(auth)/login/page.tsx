'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Mail, Lock, School, ArrowRight, ChevronDown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { apiGet } from '@/lib/api';
import { toast } from '@/hooks/useToast';
import { parseErrorMessage, cn } from '@/lib/utils';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(1, 'Password is required').min(6, 'At least 6 characters'),
  rememberMe: z.boolean().optional(),
  schoolCode: z.string().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showSchoolCode, setShowSchoolCode] = useState(false);
  const [resolvingTenant, setResolvingTenant] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', rememberMe: false, schoolCode: '' },
  });

  useEffect(() => {
    const school = searchParams.get('school');
    if (school) {
      setValue('schoolCode', school);
      setShowSchoolCode(true);
    }
  }, [searchParams, setValue]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      let tenantId: string | undefined;

      if (data.schoolCode?.trim()) {
        setResolvingTenant(true);
        try {
          const resp = await apiGet<any>(`/auth/tenant/lookup?slug=${encodeURIComponent(data.schoolCode.trim().toLowerCase())}`);
          const tenant = resp?.data ?? resp;
          tenantId = tenant.id;
        } catch {
          toast.error('School not found', `No school with code "${data.schoolCode}" exists.`);
          return;
        } finally {
          setResolvingTenant(false);
        }
      }

      const result = await signIn({ email: data.email, password: data.password, tenantId });
      if (result?.requiresMfa) {
        router.push('/2fa');
      }
    } catch (error) {
      toast.error('Sign in failed', parseErrorMessage(error));
    }
  };

  const handleGoogleLogin = () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
    window.location.href = `${apiUrl}/auth/google`;
  };

  const busy = isLoading || resolvingTenant;

  return (
    <div className="animate-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
        <p className="text-muted-foreground mt-1.5 text-sm">
          Sign in to your EduAI account to continue
        </p>
      </div>

      {/* Google OAuth */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        className="w-full flex items-center justify-center gap-3 h-10 border border-input rounded-md text-sm font-medium text-foreground bg-background hover:bg-accent transition-colors mb-6"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
        Continue with Google
      </button>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">or continue with email</span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {/* Email */}
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

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="password" className="text-sm font-medium text-foreground">Password</label>
            <Link href="/forgot-password" className="text-xs text-primary hover:underline">Forgot password?</Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              {...register('password')}
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              className={cn(
                'flex h-10 w-full rounded-md border bg-background px-3 py-2 pl-10 pr-10 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors',
                errors.password ? 'border-destructive' : 'border-input'
              )}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="mt-1.5 text-xs text-destructive">{errors.password.message}</p>}
        </div>

        {/* School code (collapsible) */}
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
            <div className="mt-2">
              <div className="relative">
                <School className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  {...register('schoolCode')}
                  type="text"
                  placeholder="e.g. demo-school"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-10 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Required if your school has multiple accounts using the same email address.
              </p>
            </div>
          )}
        </div>

        {/* Remember me */}
        <div className="flex items-center gap-2">
          <input
            {...register('rememberMe')}
            id="rememberMe"
            type="checkbox"
            className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
          />
          <label htmlFor="rememberMe" className="text-sm text-muted-foreground">Remember me for 30 days</label>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={busy}
          className="w-full flex items-center justify-center gap-2 h-10 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {busy ? (
            <><svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg> Signing in...</>
          ) : (
            <>Sign in <ArrowRight className="h-4 w-4" /></>
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-primary font-medium hover:underline">Create one free</Link>
      </p>
    </div>
  );
}
