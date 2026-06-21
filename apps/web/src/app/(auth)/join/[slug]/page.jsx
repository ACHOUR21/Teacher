'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { User, Mail, Lock, Eye, EyeOff, GraduationCap, Users, ArrowRight, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/useToast';
import { apiGet } from '@/lib/api';
import { parseErrorMessage, cn } from '@/lib/utils';
const schema = z
    .object({
    firstName: z.string().min(1, 'First name is required').max(50),
    lastName: z.string().min(1, 'Last name is required').max(50),
    email: z.string().email('Enter a valid email'),
    password: z
        .string()
        .min(8, 'At least 8 characters')
        .regex(/[A-Z]/, 'Must include uppercase letter')
        .regex(/[0-9]/, 'Must include a number'),
    confirmPassword: z.string(),
    role: z.enum(['STUDENT', 'PARENT'], { required_error: 'Select a role' }),
})
    .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
});
const roleOptions = [
    { value: 'STUDENT', label: 'Student', description: 'Access courses & AI tutor', icon: GraduationCap },
    { value: 'PARENT', label: 'Parent', description: 'Monitor your child', icon: Users },
];
export default function JoinPage() {
    const params = useParams();
    const slug = params.slug;
    const { signUp, isLoading } = useAuth();
    const [tenant, setTenant] = useState(null);
    const [tenantLoading, setTenantLoading] = useState(true);
    const [tenantError, setTenantError] = useState(false);
    const [showPw, setShowPw] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
        resolver: zodResolver(schema),
    });
    const selectedRole = watch('role');
    useEffect(() => {
        apiGet(`/auth/tenant/lookup?slug=${encodeURIComponent(slug)}`)
            .then(setTenant)
            .catch(() => setTenantError(true))
            .finally(() => setTenantLoading(false));
    }, [slug]);
    const onSubmit = async (data) => {
        if (!tenant) {
            return;
        }
        try {
            await signUp({
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                password: data.password,
                role: data.role,
                tenantId: tenant.id,
            });
            toast.success('Account created!', `Welcome to ${tenant.name}`);
        }
        catch (err) {
            toast.error('Registration failed', parseErrorMessage(err));
        }
    };
    if (tenantLoading) {
        return (<div className="flex items-center justify-center py-12">
        <svg className="h-6 w-6 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      </div>);
    }
    if (tenantError || !tenant) {
        return (<div className="text-center space-y-4">
        <div className="h-14 w-14 rounded-full bg-red-100 flex items-center justify-center mx-auto">
          <AlertCircle className="h-7 w-7 text-red-500"/>
        </div>
        <h1 className="text-xl font-bold text-gray-900">School not found</h1>
        <p className="text-sm text-gray-500">
          The school code <span className="font-mono font-semibold">{slug}</span> doesn't exist or is no longer active.
        </p>
        <p className="text-sm text-gray-500">Ask your teacher for the correct invite link.</p>
        <Link href="/login" className="text-sm text-primary font-medium hover:underline">
          Back to sign in →
        </Link>
      </div>);
    }
    return (<div className="animate-in">
      {/* School badge */}
      <div className="mb-6 flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
        {tenant.logoUrl ? (<img src={tenant.logoUrl} alt={tenant.name} className="h-10 w-10 rounded-lg object-cover"/>) : (<div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <GraduationCap className="h-5 w-5 text-primary"/>
          </div>)}
        <div>
          <p className="text-xs text-muted-foreground">Joining</p>
          <p className="text-sm font-semibold text-foreground">{tenant.name}</p>
        </div>
      </div>

      <div className="mb-5">
        <h1 className="text-2xl font-bold text-foreground">Create your account</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          You'll have immediate access to all courses on {tenant.name}.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {/* Role */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">I am a...</label>
          <div className="grid grid-cols-2 gap-2">
            {roleOptions.map(({ value, label, description, icon: Icon }) => (<button key={value} type="button" onClick={() => setValue('role', value, { shouldValidate: true })} className={cn('flex flex-col items-center gap-1.5 p-3 rounded-lg border text-center transition-all', selectedRole === value
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-input text-muted-foreground hover:border-primary/50 hover:bg-accent')}>
                <Icon className={cn('h-5 w-5', selectedRole === value ? 'text-primary' : 'text-muted-foreground')}/>
                <span className="text-xs font-semibold">{label}</span>
                <span className="text-[10px] leading-tight">{description}</span>
              </button>))}
          </div>
          {errors.role && <p className="mt-1 text-xs text-destructive">{errors.role.message}</p>}
        </div>

        {/* Name */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">First name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
              <input {...register('firstName')} type="text" autoComplete="given-name" placeholder="Jane" className={cn('flex h-10 w-full rounded-md border bg-background px-3 py-2 pl-9 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors', errors.firstName ? 'border-destructive' : 'border-input')}/>
            </div>
            {errors.firstName && <p className="mt-1 text-xs text-destructive">{errors.firstName.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Last name</label>
            <input {...register('lastName')} type="text" autoComplete="family-name" placeholder="Doe" className={cn('flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors', errors.lastName ? 'border-destructive' : 'border-input')}/>
            {errors.lastName && <p className="mt-1 text-xs text-destructive">{errors.lastName.message}</p>}
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Email address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
            <input {...register('email')} type="email" autoComplete="email" placeholder="you@example.com" className={cn('flex h-10 w-full rounded-md border bg-background px-3 py-2 pl-10 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors', errors.email ? 'border-destructive' : 'border-input')}/>
          </div>
          {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
            <input {...register('password')} type={showPw ? 'text' : 'password'} autoComplete="new-password" placeholder="Min 8 chars, uppercase, number" className={cn('flex h-10 w-full rounded-md border bg-background px-3 py-2 pl-10 pr-10 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors', errors.password ? 'border-destructive' : 'border-input')}/>
            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showPw ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
            </button>
          </div>
          {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>}
        </div>

        {/* Confirm password */}
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

        <button type="submit" disabled={isLoading} className="w-full flex items-center justify-center gap-2 h-10 bg-primary text-primary-foreground rounded-md text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors">
          {isLoading ? (<><svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg> Creating account…</>) : (<>Join {tenant.name} <ArrowRight className="h-4 w-4"/></>)}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="text-primary font-medium hover:underline">Sign in</Link>
      </p>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        Are you a teacher?{' '}
        <Link href="/start" className="text-primary font-medium hover:underline">Create a school →</Link>
      </p>
    </div>);
}
