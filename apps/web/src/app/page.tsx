'use client';

import { ArrowRight, Brain, Users, BookOpen, Video, Award, Zap, BarChart } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useAuthStore } from '@/stores/authStore';

const FEATURES = [
  { icon: Brain, title: 'AI-Powered Learning', description: 'Personalized AI tutors, automated exam generation, and intelligent content recommendations.' },
  { icon: Users, title: 'Multi-Tenant Platform', description: 'Run thousands of schools and universities on a single secure, white-labeled platform.' },
  { icon: Video, title: 'Live Classroom', description: 'Real-time video sessions with interactive whiteboards, breakout rooms, and session recording.' },
  { icon: BookOpen, title: 'Course Marketplace', description: 'Teachers sell courses globally. Students learn from the best educators worldwide.' },
  { icon: Award, title: 'Gamification', description: 'Motivate students with points, badges, leaderboards, and verifiable digital certificates.' },
  { icon: BarChart, title: 'Advanced Analytics', description: 'Predictive analytics to identify at-risk students and optimize learning outcomes.' },
];

const PLANS = [
  { name: 'Free Trial', price: '$0', period: '30 days', features: ['30 students', '5 courses', '1GB storage', 'Basic AI'] },
  { name: 'Professional', price: '$79', period: '/month', features: ['500 students', 'Unlimited courses', '50GB storage', 'Full AI suite', 'Live classroom', 'White label'], featured: true },
  { name: 'Enterprise', price: 'Custom', period: '', features: ['Unlimited students', 'Dedicated infrastructure', 'Custom integrations', '24/7 SLA support'] },
];

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated, _hasHydrated } = useAuthStore();

  useEffect(() => {
    if (_hasHydrated && isAuthenticated) {
      router.replace('/courses');
    }
  }, [isAuthenticated, _hasHydrated, router]);

  // While the store is hydrating, show nothing to avoid flash of landing page
  if (!_hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="h-8 w-8 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  // Authenticated users are redirected — only render landing for guests
  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-100 px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600" />
          <span className="font-bold text-gray-900">EduAI Ultimate</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm text-gray-600">
          <a href="#features" className="hover:text-gray-900">Features</a>
          <a href="#pricing" className="hover:text-gray-900">Pricing</a>
          <Link href="/login" className="hover:text-gray-900">Sign In</Link>
        </div>
        <Link href="/start" className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          Get Started Free
        </Link>
      </nav>

      {/* Hero */}
      <section className="px-6 py-24 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full mb-8">
          <Zap className="h-3 w-3" /> Powered by Claude AI & GPT-4o
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
          The Complete<br />
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">AI Education Platform</span>
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10">
          LMS + School ERP + University ERP + AI Tutors + Live Classroom + Marketplace — all in one enterprise-grade SaaS.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/start" className="bg-blue-600 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
            Start Free Trial <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/login" className="bg-gray-100 text-gray-700 font-semibold px-8 py-3.5 rounded-xl hover:bg-gray-200 transition-colors">
            View Demo
          </Link>
        </div>
        <p className="text-sm text-gray-400 mt-4">No credit card required · 30-day free trial</p>
      </section>

      {/* Features */}
      <section id="features" className="px-6 py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900">Everything your institution needs</h2>
            <p className="text-gray-500 mt-3">20 integrated modules, 17 AI features, one platform.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(f => (
              <div key={f.title} className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-md transition-shadow">
                <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
                  <f.icon className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="px-6 py-16 max-w-4xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[['10M+', 'Students worldwide'], ['50K+', 'Courses published'], ['99.9%', 'Uptime SLA'], ['24/7', 'AI tutoring']].map(([stat, label]) => (
            <div key={label}>
              <p className="text-3xl font-bold text-gray-900">{stat}</p>
              <p className="text-sm text-gray-500 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-6 py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900">Simple, transparent pricing</h2>
            <p className="text-gray-500 mt-3">Scale from a single classroom to a global institution.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.map(plan => (
              <div key={plan.name} className={`bg-white rounded-2xl p-8 border-2 ${plan.featured ? 'border-blue-500 shadow-lg' : 'border-gray-200'}`}>
                {plan.featured && <div className="text-xs font-semibold text-blue-600 mb-3">MOST POPULAR</div>}
                <h3 className="font-bold text-gray-900 text-xl">{plan.name}</h3>
                <div className="mt-2 mb-6">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-500 text-sm">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map(f => (
                    <li key={f} className="text-sm text-gray-600 flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0" />{f}
                    </li>
                  ))}
                </ul>
                <Link href="/start" className={`block w-full text-center py-3 rounded-xl font-semibold text-sm transition-colors ${plan.featured ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                  {plan.price === 'Custom' ? 'Contact Sales' : 'Get Started'}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 border-t border-gray-100 text-center text-sm text-gray-400">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="h-6 w-6 rounded-md bg-gradient-to-br from-blue-600 to-purple-600" />
          <span className="font-semibold text-gray-700">EduAI Ultimate</span>
        </div>
        <p>© {new Date().getFullYear()} EduAI Ultimate. GDPR · FERPA · COPPA Compliant.</p>
      </footer>
    </div>
  );
}
