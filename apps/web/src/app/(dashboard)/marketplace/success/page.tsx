'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, BookOpen, ShoppingBag } from 'lucide-react';

function SuccessInner() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="max-w-md w-full text-center space-y-6 bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
        <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment successful!</h1>
          <p className="text-gray-500 mt-2 text-sm">
            You're now enrolled. Your course is ready to start.
          </p>
          {sessionId && (
            <p className="text-xs text-gray-400 mt-1 font-mono">Ref: {sessionId.slice(-12)}</p>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href="/courses"
            className="flex items-center justify-center gap-2 w-full h-10 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <BookOpen className="h-4 w-4" />
            Go to My Courses
          </Link>
          <Link
            href="/marketplace"
            className="flex items-center justify-center gap-2 w-full h-10 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <ShoppingBag className="h-4 w-4" />
            Browse More Courses
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function MarketplaceSuccessPage() {
  return (
    <Suspense>
      <SuccessInner />
    </Suspense>
  );
}
