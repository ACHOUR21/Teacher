'use client';
import { CheckCircle, XCircle, Loader2, MailCheck } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';

import { api } from '@/lib/api';
function VerifyEmailPageInner() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');
    const [state, setState] = useState(token ? 'verifying' : 'no-token');
    const [errorMessage, setErrorMessage] = useState('');
    useEffect(() => {
        if (!token) {
            return;
        }
        api.get(`/auth/verify-email?token=${token}`)
            .then(() => {
            setState('success');
            setTimeout(() => router.push('/login'), 3000);
        })
            .catch((err) => {
            setState('error');
            setErrorMessage(err?.response?.data?.message ?? 'This link has expired or is invalid.');
        });
    }, [token, router]);
    return (<div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center space-y-6">
        {state === 'verifying' && (<>
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Loader2 className="h-8 w-8 text-primary animate-spin"/>
            </div>
            <h1 className="text-2xl font-bold text-foreground">Verifying your email…</h1>
            <p className="text-muted-foreground">Please wait while we confirm your address.</p>
          </>)}

        {state === 'success' && (<>
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <CheckCircle className="h-8 w-8 text-green-600"/>
            </div>
            <h1 className="text-2xl font-bold text-foreground">Email verified!</h1>
            <p className="text-muted-foreground">Your account is now active. Redirecting to login…</p>
            <Link href="/login" className="inline-block text-sm text-primary font-medium hover:underline">
              Go to login →
            </Link>
          </>)}

        {state === 'error' && (<>
            <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
              <XCircle className="h-8 w-8 text-red-600"/>
            </div>
            <h1 className="text-2xl font-bold text-foreground">Verification failed</h1>
            <p className="text-muted-foreground">{errorMessage}</p>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Need a new verification link?</p>
              <Link href="/login" className="inline-block text-sm text-primary font-medium hover:underline">
                Sign in to resend →
              </Link>
            </div>
          </>)}

        {state === 'no-token' && (<>
            <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto">
              <MailCheck className="h-8 w-8 text-blue-600"/>
            </div>
            <h1 className="text-2xl font-bold text-foreground">Check your email</h1>
            <p className="text-muted-foreground">
              We've sent a verification link to your email address. Click the link to activate your account.
            </p>
            <p className="text-xs text-muted-foreground">Didn't receive it? Check your spam folder or sign in to resend.</p>
            <Link href="/login" className="inline-block text-sm text-primary font-medium hover:underline">
              Back to login →
            </Link>
          </>)}
      </div>
    </div>);
}
export default function VerifyEmailPage() {
    return (<Suspense>
      <VerifyEmailPageInner />
    </Suspense>);
}
