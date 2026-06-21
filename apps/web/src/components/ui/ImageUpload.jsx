'use client';
import { ImageIcon, AlertCircle } from 'lucide-react';
import React, { useRef, useState } from 'react';

import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
export function ImageUpload({ value, onChange, folder = 'images', className, label = 'Upload image', maxSizeMB = 10, aspectRatio = 'video', }) {
    const inputRef = useRef(null);
    const [state, setState] = useState('idle');
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState('');
    const aspectClass = aspectRatio === 'video' ? 'aspect-video' : aspectRatio === 'square' ? 'aspect-square' : '';
    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) {
            return;
        }
        if (file.size > maxSizeMB * 1024 * 1024) {
            setError(`File exceeds ${maxSizeMB} MB`);
            return;
        }
        setError('');
        setState('requesting');
        setProgress(0);
        try {
            const { data } = await api.post('/storage/presigned-url', {
                filename: file.name,
                contentType: file.type || 'image/jpeg',
                folder,
            });
            const { uploadUrl, publicUrl } = data.data ?? data;
            setState('uploading');
            // Detect local vs S3 upload: local endpoint is our own API, S3 is an external presigned PUT URL
            const isLocalUpload = isLocalStorageUrl(uploadUrl);
            if (isLocalUpload) {
                await uploadMultipart(file, uploadUrl, (pct) => setProgress(pct));
            }
            else {
                await uploadWithProgress(file, uploadUrl, (pct) => setProgress(pct));
            }
            onChange(publicUrl);
            setState('done');
        }
        catch (err) {
            setState('error');
            setError(err?.response?.data?.message ?? err?.message ?? 'Upload failed');
        }
        finally {
            if (inputRef.current) {
                inputRef.current.value = '';
            }
        }
    };
    return (<div className={cn('space-y-2', className)}>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange}/>

      {value ? (<div className={cn('relative group w-full rounded-lg overflow-hidden border border-gray-200 bg-gray-50', aspectClass)}>
          <img src={value} alt="Preview" className="w-full h-full object-cover"/>
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button type="button" onClick={() => inputRef.current?.click()} className="px-3 py-1.5 bg-white rounded-md text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors">
              Change
            </button>
            <button type="button" onClick={() => { onChange(''); setState('idle'); setProgress(0); setError(''); }} className="px-3 py-1.5 bg-white rounded-md text-xs font-medium text-red-600 hover:bg-red-50 transition-colors">
              Remove
            </button>
          </div>
        </div>) : (<button type="button" disabled={state === 'requesting' || state === 'uploading'} onClick={() => inputRef.current?.click()} className={cn('w-full flex flex-col items-center justify-center gap-2 px-4 py-8 border-2 border-dashed rounded-lg text-sm transition-all', aspectClass, state === 'error'
                ? 'border-red-300 text-red-500 hover:bg-red-50'
                : 'border-gray-200 text-gray-400 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50/40', (state === 'requesting' || state === 'uploading') && 'pointer-events-none')}>
          {state === 'requesting' ? (<><SpinIcon /><span className="text-xs">Preparing…</span></>) : state === 'uploading' ? (<><SpinIcon /><span className="text-xs">Uploading {progress}%</span></>) : state === 'error' ? (<><AlertCircle className="h-5 w-5"/><span className="text-xs">{error} — click to retry</span></>) : (<>
              <ImageIcon className="h-5 w-5"/>
              <span className="text-xs">{label}</span>
              <span className="text-xs text-gray-300">PNG, JPG, WebP up to {maxSizeMB} MB</span>
            </>)}
        </button>)}

      {state === 'uploading' && (<div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 transition-all duration-200" style={{ width: `${progress}%` }}/>
        </div>)}
    </div>);
}
function SpinIcon() {
    return (<svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>);
}
/** Returns true when the upload URL targets our own API (local storage mode). */
function isLocalStorageUrl(uploadUrl) {
    try {
        const url = new URL(uploadUrl);
        const apiUrl = typeof window !== 'undefined'
            ? window.location.origin
            : (process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001');
        // Matches our own host or localhost/127.0.0.1 patterns
        return (url.pathname.includes('/storage/upload') ||
            url.hostname === 'localhost' ||
            url.hostname === '127.0.0.1' ||
            url.origin === apiUrl);
    }
    catch {
        return false;
    }
}
/** Upload using raw PUT (for S3 presigned URLs). */
function uploadWithProgress(file, uploadUrl, onProgress) {
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
            }
            else {
                reject(new Error(`Upload failed: ${xhr.statusText}`));
            }
        };
        xhr.onerror = () => reject(new Error('Network error during upload'));
        xhr.send(file);
    });
}
/** Upload using multipart POST (for local storage endpoint). */
function uploadMultipart(file, uploadUrl, onProgress) {
    return new Promise((resolve, reject) => {
        const formData = new FormData();
        formData.append('file', file);
        const xhr = new XMLHttpRequest();
        xhr.open('POST', uploadUrl, true);
        // Read access token from Zustand persisted store in localStorage
        const token = getStoredToken();
        if (token) {
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }
        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
                onProgress(Math.round((e.loaded / e.total) * 100));
            }
        };
        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                onProgress(100);
                resolve();
            }
            else {
                reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
            }
        };
        xhr.onerror = () => reject(new Error('Network error during upload'));
        xhr.send(formData);
    });
}
/** Read the JWT access token from the Zustand persisted auth store. */
function getStoredToken() {
    if (typeof window === 'undefined') {
        return null;
    }
    try {
        const raw = localStorage.getItem('eduai-auth');
        if (!raw) {
            return null;
        }
        const parsed = JSON.parse(raw);
        return parsed?.state?.accessToken ?? null;
    }
    catch {
        return null;
    }
}
