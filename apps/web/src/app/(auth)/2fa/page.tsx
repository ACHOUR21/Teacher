'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, ArrowRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/useToast';
import { parseErrorMessage } from '@/lib/utils';

export default function TwoFactorPage() {
  const { verifyMfa, isLoading } = useAuth();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState('');

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    const sanitized = value.replace(/\D/g, '').slice(-1);
    const newCode = [...code];
    newCode[index] = sanitized;
    setCode(newCode);
    setError('');

    // Auto-advance to next input
    if (sanitized && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (code[index]) {
        const newCode = [...code];
        newCode[index] = '';
        setCode(newCode);
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
        const newCode = [...code];
        newCode[index - 1] = '';
        setCode(newCode);
      }
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, 6);
    if (pasted.length === 6) {
      const digits = pasted.split('');
      setCode(digits);
      inputRefs.current[5]?.focus();
    }
  };

  const handleRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryCode.trim()) return;
    try {
      await verifyMfa(recoveryCode.trim());
    } catch (err) {
      const message = parseErrorMessage(err);
      setError(message || 'Invalid recovery code.');
      toast.error('Verification failed', message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = code.join('');
    if (fullCode.length < 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }
    try {
      await verifyMfa(fullCode);
    } catch (err) {
      const message = parseErrorMessage(err);
      setError(message || 'Invalid code. Please try again.');
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      toast.error('Verification failed', message);
    }
  };

  const isComplete = code.every((d) => d !== '');

  return (
    <div className="animate-in">
      <div className="mb-8">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to sign in
        </Link>

        <div className="flex justify-center mb-6">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Shield className="h-7 w-7 text-primary" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-foreground text-center">
          Two-factor authentication
        </h1>
        <p className="text-muted-foreground mt-2 text-sm text-center leading-relaxed">
          Enter the 6-digit code from your authenticator app to complete sign in.
        </p>
      </div>

      {recoveryMode ? (
        <form onSubmit={handleRecoverySubmit} noValidate>
          <div className="mb-6">
            <label className="block text-sm font-medium text-foreground mb-2">Recovery Code</label>
            <input
              type="text"
              placeholder="XXXX-XXXX-XXXX"
              value={recoveryCode}
              onChange={(e) => { setRecoveryCode(e.target.value); setError(''); }}
              className="w-full h-10 px-3 rounded-md border-2 border-input bg-background text-sm font-mono focus:outline-none focus:border-primary"
              autoFocus
            />
          </div>
          {error && <p className="text-xs text-destructive text-center mb-4">{error}</p>}
          <button
            type="submit"
            disabled={isLoading || !recoveryCode.trim()}
            className="w-full flex items-center justify-center gap-2 h-10 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50 transition-colors"
          >
            {isLoading ? 'Verifying...' : <>Verify recovery code <ArrowRight className="h-4 w-4" /></>}
          </button>
        </form>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          <div className="flex gap-2 justify-center mb-6" onPaste={handlePaste}>
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className={`w-11 h-14 text-center text-xl font-bold rounded-lg border-2 bg-background transition-all focus:outline-none ${
                  error
                    ? 'border-destructive text-destructive'
                    : digit
                    ? 'border-primary text-foreground'
                    : 'border-input text-foreground focus:border-primary'
                }`}
                aria-label={`Digit ${index + 1}`}
              />
            ))}
          </div>

          {error && (
            <p className="text-xs text-destructive text-center mb-4">{error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading || !isComplete}
            className="w-full flex items-center justify-center gap-2 h-10 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 transition-colors"
          >
            {isLoading ? (
              <>
                <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Verifying...
              </>
            ) : (
              <>
                Verify & sign in
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>
      )}

      <div className="mt-6 text-center space-y-2">
        {recoveryMode ? (
          <>
            <p className="text-xs text-muted-foreground">Have your authenticator?</p>
            <button onClick={() => { setRecoveryMode(false); setError(''); }} className="text-xs text-primary hover:underline">
              Use authenticator app instead
            </button>
          </>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">Lost access to your authenticator?</p>
            <button onClick={() => { setRecoveryMode(true); setError(''); }} className="text-xs text-primary hover:underline">
              Use a recovery code
            </button>
          </>
        )}
      </div>
    </div>
  );
}
