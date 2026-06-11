import { BookMarked } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col">
      {/* Minimal top bar */}
      <header className="h-14 flex items-center px-6 border-b border-white/60 bg-white/50 backdrop-blur-sm">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
            <BookMarked className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-gray-900 text-sm">EduAI Ultimate</span>
        </Link>
      </header>

      {/* Centered content */}
      <main className="flex-1 flex items-start justify-center px-4 py-10">
        <div className="w-full max-w-2xl">{children}</div>
      </main>

      <footer className="h-10 flex items-center justify-center">
        <p className="text-xs text-gray-400">
          &copy; {new Date().getFullYear()} EduAI Ultimate. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
