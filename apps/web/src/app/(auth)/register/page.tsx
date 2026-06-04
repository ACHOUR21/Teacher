'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  GraduationCap,
  Users,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/useToast';
import { cn, parseErrorMessage } from '@/lib/utils';

const registerSchema = z
  .object({
    firstName: z
      .string()
      .min(1, 'First name is required')
      .max(50, 'First name too long'),
    lastName: z
      .string()
      .min(1, 'Last name is required')
      .max(50, 'Last name too long'),
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Please enter a valid email'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain uppercase, lowercase, and a number'
      ),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    role: z.enum(['teacher', 'student', 'parent'], {
      required_error: 'Please select a role',
    }),
    agreeToTerms: z.literal(true, {
      errorMap: () => ({ message: 'You must agree to the terms of service' }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

type RoleOption = {
  value: 'teacher' | 'student' | 'parent';
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
};

const roles: RoleOption[] = [
  {
    value: 'teacher',
    label: 'Teacher',
    description: 'Create and manage courses',
    icon: BookOpen,
  },
  {
    value: 'student',
    label: 'Student',
    description: 'Access courses and AI tutor',
    icon: GraduationCap,
  },
  {
    value: 'parent',
    label: 'Parent',
    description: 'Monitor child progress',
    icon: Users,
  },
];

export default function RegisterPage() {
  const { signUp, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await signUp({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        role: data.role,
      });
      toast.success(
        'Account created!',
        'Please check your email to verify your account.'
      );
    } catch (error) {
      const message = parseErrorMessage(error);
      toast.error('Registration failed', message);
    }
  };

  return (
    <div className="animate-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Create your account</h1>
        <p className="text-muted-foreground mt-1.5 text-sm">
          Join thousands of educators and students on EduAI
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {/* Name row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              First name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                {...register('firstName')}
                type="text"
                autoComplete="given-name"
                placeholder="Jane"
                className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 pl-9 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 transition-colors ${
                  errors.firstName ? 'border-destructive' : 'border-input'
                }`}
              />
            </div>
            {errors.firstName && (
              <p className="mt-1 text-xs text-destructive">
                {errors.firstName.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Last name
            </label>
            <input
              {...register('lastName')}
              type="text"
              autoComplete="family-name"
              placeholder="Doe"
              className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 transition-colors ${
                errors.lastName ? 'border-destructive' : 'border-input'
              }`}
            />
            {errors.lastName && (
              <p className="mt-1 text-xs text-destructive">
                {errors.lastName.message}
              </p>
            )}
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Email address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              {...register('email')}
              type="email"
              autoComplete="email"
              placeholder="you@school.edu"
              className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 pl-10 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 transition-colors ${
                errors.email ? 'border-destructive' : 'border-input'
              }`}
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-xs text-destructive">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Role selection */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            I am a...
          </label>
          <div className="grid grid-cols-3 gap-2">
            {roles.map(({ value, label, description, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setValue('role', value, { shouldValidate: true })}
                className={cn(
                  'flex flex-col items-center gap-1.5 p-3 rounded-lg border text-center transition-all',
                  selectedRole === value
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-input text-muted-foreground hover:border-primary/50 hover:bg-accent'
                )}
              >
                <Icon
                  className={cn(
                    'h-5 w-5',
                    selectedRole === value ? 'text-primary' : 'text-muted-foreground'
                  )}
                />
                <span className="text-xs font-semibold">{label}</span>
                <span className="text-[10px] leading-tight">{description}</span>
              </button>
            ))}
          </div>
          {errors.role && (
            <p className="mt-1 text-xs text-destructive">{errors.role.message}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="••••••••"
              className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 pl-10 pr-10 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 transition-colors ${
                errors.password ? 'border-destructive' : 'border-input'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-xs text-destructive">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Confirm password */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Confirm password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              {...register('confirmPassword')}
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="••••••••"
              className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 pl-10 pr-10 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 transition-colors ${
                errors.confirmPassword ? 'border-destructive' : 'border-input'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-1 text-xs text-destructive">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {/* Terms */}
        <div className="flex items-start gap-2">
          <input
            {...register('agreeToTerms')}
            id="agreeToTerms"
            type="checkbox"
            className="h-4 w-4 mt-0.5 rounded border-input text-primary focus:ring-primary shrink-0"
          />
          <label htmlFor="agreeToTerms" className="text-xs text-muted-foreground leading-relaxed">
            I agree to the{' '}
            <Link href="/terms" className="text-primary hover:underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
          </label>
        </div>
        {errors.agreeToTerms && (
          <p className="-mt-2 text-xs text-destructive">
            {errors.agreeToTerms.message}
          </p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 h-10 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 transition-colors"
        >
          {isLoading ? (
            <>
              <svg
                className="h-4 w-4 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Creating account...
            </>
          ) : (
            <>
              Create account
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="text-primary font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
