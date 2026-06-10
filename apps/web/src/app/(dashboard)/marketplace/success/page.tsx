'use client';

import { useQuery } from '@tanstack/react-query';
import { CheckCircle, BookOpen, ShoppingBag, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';

const REDIRECT_SECONDS = 5;

function SuccessInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const courseId = searchParams.get('courseId') ?? searchParams.get('course_id');
  const sessionId = searchParams.get('session_id');
  const [countdown, setCountdown] = useState(REDIRECT_SECONDS);

  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: ['course-brief', courseId],
    queryFn: () => api.get(`/courses/${courseId}`).then(r => (r.data.data ?? r.data) as { title: string }),
    enabled: !!courseId,
  });

  // Auto-redirect countdown
  useEffect(() => {
    if (countdown <= 0) {
      router.push(courseId ? `/courses/${courseId}/learn` : '/courses');
      return;
    }
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, courseId, router]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="max-w-md w-full text-center space-y-6 bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
        {/* Icon */}
        <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>

        {/* Heading */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Enrollment Confirmed!</h1>
          <p className="text-gray-500 mt-2 text-sm leading-relaxed">
            {courseLoading ? (
              <span className="flex items-center justify-center gap-1 text-gray-400">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Loading course details…
              </span>
            ) : course ? (
              <>
                You&apos;ve successfully enrolled in{' '}
                <span className="font-semibold text-gray-800">{course.title}</span>.
              </>
            ) : (
              "You've successfully enrolled. Your course is ready to start."
            )}
          </p>
          {sessionId && (
            <p className="text-xs text-gray-400 mt-2 font-mono">Ref: {sessionId.slice(-12)}</p>
          )}
        </div>

        {/* Countdown */}
        <div className="flex items-center justify-center gap-1.5 text-sm text-gray-400">
          <span>Redirecting in</span>
          <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-blue-600 font-bold text-sm">
            {countdown}
          </span>
          <span>seconds…</span>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Link href={courseId ? `/courses/${courseId}/learn` : '/courses'}>
            <Button className="w-full gap-2">
              <BookOpen className="h-4 w-4" />
              Start Learning
            </Button>
          </Link>
          <Link href="/marketplace">
            <Button variant="outline" className="w-full gap-2">
              <ShoppingBag className="h-4 w-4" />
              Browse More Courses
            </Button>
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
