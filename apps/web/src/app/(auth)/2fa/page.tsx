'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, ArrowRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/useToast';
import { parseErrorMessage } from '@/lib/utils';

// Stable device fingerprint stored in sessionStorage
function getDeviceId(): string {
  const key = 'eduai_device_id';
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(key, id);
  }
  return id;
}

export default function TwoFactorPage() {
  const { verifyMfa, isLoading } = useAuth();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState('');
  const [trustDevice, setTrustDevice] = useState(false);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    const sanitized = value.replace(/\D/g, '').slice(-1);
    const newCode = [...code];
    newCode[index] = sanitized;
    setCode(newCode);
    setError('');

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
    if (e.key === 'ArrowLeft' && index > 0) inputRefs.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setCode(pasted.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  const deviceOpts = trustDevice
    ? { trustDevice: true, deviceId: getDeviceId(), deviceName: navigator.userAgent.slice(0, 100) }
    : undefined;

  const handleRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = recoveryCode.trim().toUpperCase();
    if (!trimmed) return;
    try {
      await verifyMfa(trimmed, deviceOpts);
    } catch (err) {
      const message = parseErrorMessage(err);
      setError(message || 'Invalid backup code.');
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
      await verifyMfa(fullCode, deviceOpts);
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
          {recoveryMode
            ? 'Enter one of your backup codes to access your account.'
            : 'Enter the 6-digit code from your authenticator app.'}
        </p>
      </div>

      {recoveryMode ? (
        <form onSubmit={handleRecoverySubmit} noValidate>
          <div className="mb-6">
            <label className="block text-sm font-medium text-foreground mb-2">Backup Code</label>
            <input
              type="text"
              placeholder="e.g. A3BX9QZP"
              value={recoveryCode}
              onChange={(e) => { setRecoveryCode(e.target.value); setError(''); }}
              className="w-full h-10 px-3 rounded-md border-2 border-input bg-background text-sm font-mono uppercase tracking-widest focus:outline-none focus:border-primary"
              autoFocus
            />
            <p className="mt-1.5 text-xs text-muted-foreground">Each backup code can only be used once.</p>
          </div>
          {error && <p className="text-xs text-destructive text-center mb-4">{error}</p>}

          {/* Trust device */}
          <label className="flex items-center gap-2 mb-5 cursor-pointer">
            <input
              type="checkbox"
              checked={trustDevice}
              onChange={e => setTrustDevice(e.target.checked)}
              className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
            />
            <span className="text-sm text-muted-foreground">Trust this device for 30 days</span>
          </label>

          <button
            type="submit"
            disabled={isLoading || !recoveryCode.trim()}
            className="w-full flex items-center justify-center gap-2 h-10 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50 transition-colors"
          >
            {isLoading ? 'Verifying...' : <>Verify backup code <ArrowRight className="h-4 w-4" /></>}
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

          {/* Trust device */}
          <label className="flex items-center gap-2 mb-5 cursor-pointer">
            <input
              type="checkbox"
              checked={trustDevice}
              onChange={e => setTrustDevice(e.target.checked)}
              className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
            />
            <span className="text-sm text-muted-foreground">Trust this device for 30 days</span>
          </label>

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
                Verify &amp; sign in
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
              Use a backup code
            </button>
          </>
        )}
      </div>
    </div>
  );
}
