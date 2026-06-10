'use client';

import { AlertTriangle, RefreshCcw, BookOpen } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/Button';

export default function MarketplaceCancelPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="max-w-md w-full text-center space-y-6 bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
        {/* Icon */}
        <div className="h-20 w-20 rounded-full bg-amber-50 flex items-center justify-center mx-auto">
          <AlertTriangle className="h-10 w-10 text-amber-500" />
        </div>

        {/* Heading */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Cancelled</h1>
          <p className="text-gray-500 mt-2 text-sm">
            Your enrollment was not completed. No charge was made to your account.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Link href="/marketplace">
            <Button className="w-full gap-2">
              <RefreshCcw className="h-4 w-4" />
              Try Again
            </Button>
          </Link>
          <Link href="/courses">
            <Button variant="outline" className="w-full gap-2">
              <BookOpen className="h-4 w-4" />
              View My Courses
            </Button>
          </Link>
        </div>

        <p className="text-xs text-gray-400">
          Having trouble? Contact{' '}
          <a href="mailto:support@eduai.app" className="text-blue-500 hover:underline">
            support@eduai.app
          </a>
        </p>
      </div>
    </div>
  );
}
