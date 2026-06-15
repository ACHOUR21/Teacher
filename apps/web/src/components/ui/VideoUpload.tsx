'use client';

import { Upload, X, CheckCircle2, Film, AlertCircle } from 'lucide-react';
import React, { useRef, useState } from 'react';

import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface VideoUploadProps {
  value?: string;
  onChange: (url: string) => void;
  folder?: string;
  className?: string;
}

type UploadState = 'idle' | 'requesting' | 'uploading' | 'done' | 'error';

export function VideoUpload({ value, onChange, folder = 'lessons', className }: VideoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<UploadState>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {return;}

    const maxSize = 2 * 1024 * 1024 * 1024; // 2 GB
    if (file.size > maxSize) {
      setError('File exceeds 2 GB limit');
      return;
    }

    setFileName(file.name);
    setError('');
    setState('requesting');
    setProgress(0);

    try {
      // 1. Get upload URL from API
      const { data } = await api.post('/storage/presigned-url', {
        filename: file.name,
        contentType: file.type || 'video/mp4',
        folder,
      });
      const { uploadUrl, publicUrl } = data.data ?? data;

      // 2. Upload to URL — use multipart POST for local storage, raw PUT for S3
      setState('uploading');
      const isLocalUpload = isLocalStorageUrl(uploadUrl);
      if (isLocalUpload) {
        await uploadMultipart(file, uploadUrl, (pct) => setProgress(pct));
      } else {
        await uploadWithProgress(file, uploadUrl, (pct) => setProgress(pct));
      }

      // 3. Notify parent
      onChange(publicUrl);
      setState('done');
    } catch (err: any) {
      setState('error');
      setError(err?.response?.data?.message ?? err?.message ?? 'Upload failed');
    } finally {
      // reset input so same file can be re-selected after error
      if (inputRef.current) {inputRef.current.value = '';}
    }
  };

  const handleClear = () => {
    onChange('');
    setState('idle');
    setProgress(0);
    setFileName('');
    setError('');
  };

  return (
    <div className={cn('space-y-1', className)}>
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {!value && state !== 'done' ? (
        <button
          type="button"
          disabled={state === 'requesting' || state === 'uploading'}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'w-full flex items-center justify-center gap-2 px-3 py-2.5 border-2 border-dashed rounded-lg text-xs transition-all',
            state === 'error'
              ? 'border-red-300 text-red-500 hover:bg-red-50'
              : 'border-gray-200 text-gray-400 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50/40',
            (state === 'requesting' || state === 'uploading') && 'pointer-events-none'
          )}
        >
          {state === 'requesting' ? (
            <><SpinIcon /> Preparing…</>
          ) : state === 'uploading' ? (
            <><SpinIcon /> Uploading {progress}%</>
          ) : state === 'error' ? (
            <><AlertCircle className="h-3.5 w-3.5" /> {error} — click to retry</>
          ) : (
            <><Upload className="h-3.5 w-3.5" /> Upload video</>
          )}
        </button>
      ) : null}

      {(state === 'uploading') && (
        <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {(value || state === 'done') && (
        <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />
          <Film className="h-3.5 w-3.5 text-green-600 shrink-0" />
          <span className="text-xs text-green-700 flex-1 truncate">{fileName || 'Video uploaded'}</span>
          <button type="button" onClick={handleClear} className="p-0.5 hover:bg-green-200 rounded transition-colors">
            <X className="h-3 w-3 text-green-600" />
          </button>
        </div>
      )}
    </div>
  );
}

function SpinIcon() {
  return (
    <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

/** Returns true when the upload URL targets our own API (local storage mode). */
function isLocalStorageUrl(uploadUrl: string): boolean {
  try {
    const url = new URL(uploadUrl);
    return (
      url.pathname.includes('/storage/upload') ||
      url.hostname === 'localhost' ||
      url.hostname === '127.0.0.1'
    );
  } catch {
    return false;
  }
}

/** Upload using raw PUT (for S3 presigned URLs). */
function uploadWithProgress(file: File, uploadUrl: string, onProgress: (pct: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl, true);
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(100);
        resolve();
      } else {
        reject(new Error(`Upload failed: ${xhr.statusText}`));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.send(file);
  });
}

/** Upload using multipart POST (for local storage endpoint). */
function uploadMultipart(file: File, uploadUrl: string, onProgress: (pct: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);
    const xhr = new XMLHttpRequest();
    xhr.open('POST', uploadUrl, true);
    // Read access token from Zustand persisted store in localStorage
    const token = getStoredToken();
    if (token) { xhr.setRequestHeader('Authorization', `Bearer ${token}`); }
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(100);
        resolve();
      } else {
        reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
      }
    };
    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.send(formData);
  });
}

/** Read the JWT access token from the Zustand persisted auth store. */
function getStoredToken(): string | null {
  if (typeof window === 'undefined') { return null; }
  try {
    const raw = localStorage.getItem('eduai-auth');
    if (!raw) { return null; }
    const parsed = JSON.parse(raw) as { state?: { accessToken?: string } };
    return parsed?.state?.accessToken ?? null;
  } catch {
    return null;
  }
}
