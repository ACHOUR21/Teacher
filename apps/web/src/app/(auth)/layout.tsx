import { BookMarked, Sparkles, Shield, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

const features = [
  {
    icon: Sparkles,
    title: 'AI-Powered Tutoring',
    description:
      'Personalized learning with state-of-the-art AI that adapts to each student.',
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description:
      'SOC 2 compliant with end-to-end encryption and multi-tenant isolation.',
  },
  {
    icon: BarChart3,
    title: 'Deep Analytics',
    description:
      'Real-time insights into student performance, engagement, and outcomes.',
  },
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-700 via-primary-600 to-secondary-600 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-32 right-12 w-48 h-48 rounded-full bg-secondary-400 blur-2xl" />
          <div className="absolute top-1/2 left-1/3 w-32 h-32 rounded-full bg-primary-300 blur-2xl" />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <BookMarked className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="text-white font-bold text-xl leading-none">
                EduAI
              </div>
              <div className="text-white/70 text-xs">Ultimate Platform</div>
            </div>
          </Link>

          {/* Main hero text */}
          <div>
            <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
              The Future of
              <br />
              Education is{' '}
              <span className="text-yellow-300">Here</span>
            </h1>
            <p className="text-white/80 text-lg mb-10">
              Empower your institution with AI-driven learning tools, live
              classrooms, and deep analytics.
            </p>

            {/* Features list */}
            <div className="space-y-5">
              {features.map(({ icon: Icon, title, description }) => (
                <div key={title} className="flex items-start gap-4">
                  <div className="h-9 w-9 rounded-lg bg-white/15 backdrop-blur-sm flex items-center justify-center shrink-0">
                    <Icon className="h-4.5 w-4.5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-sm">
                      {title}
                    </h3>
                    <p className="text-white/65 text-xs mt-0.5">
                      {description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Social proof */}
          <div className="flex items-center gap-6">
            <div>
              <div className="text-white font-bold text-2xl">50K+</div>
              <div className="text-white/60 text-xs">Students enrolled</div>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div>
              <div className="text-white font-bold text-2xl">1,200+</div>
              <div className="text-white/60 text-xs">Institutions</div>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div>
              <div className="text-white font-bold text-2xl">4.9★</div>
              <div className="text-white/60 text-xs">Average rating</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 bg-background">
        {/* Mobile logo */}
        <div className="lg:hidden mb-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <BookMarked className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="text-xl font-bold">EduAI Ultimate</span>
          </Link>
        </div>

        <div className="w-full max-w-md">{children}</div>

        <p className="mt-8 text-xs text-muted-foreground text-center">
          By using EduAI, you agree to our{' '}
          <Link href="/terms" className="text-primary hover:underline">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
