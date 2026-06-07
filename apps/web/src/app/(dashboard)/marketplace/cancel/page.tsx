'use client';

import Link from 'next/link';
import { XCircle, RefreshCcw } from 'lucide-react';

export default function MarketplaceCancelPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="max-w-md w-full text-center space-y-6 bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
        <div className="h-16 w-16 rounded-full bg-red-50 flex items-center justify-center mx-auto">
          <XCircle className="h-8 w-8 text-red-400" />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment cancelled</h1>
          <p className="text-gray-500 mt-2 text-sm">
            Your payment was not completed. No charge was made.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href="/marketplace"
            className="flex items-center justify-center gap-2 w-full h-10 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <RefreshCcw className="h-4 w-4" />
            Return to Marketplace
          </Link>
        </div>
      </div>
    </div>
  );
}
