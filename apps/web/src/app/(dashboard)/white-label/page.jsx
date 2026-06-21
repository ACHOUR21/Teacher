'use client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Palette, Eye } from 'lucide-react';
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { WhiteLabelPreview } from '@/components/white-label/WhiteLabelPreview';
import { toast } from '@/hooks/useToast';
import { api } from '@/lib/api';
const DEFAULT_VALUES = {
    brandName: '',
    customDomain: '',
    logoUrl: '',
    faviconUrl: '',
    primaryColor: '#2563EB',
    secondaryColor: '#7C3AED',
    customCss: '',
    emailFrom: '',
};
function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    }
    catch {
        return false;
    }
}
// ─── Component ────────────────────────────────────────────────────────────────
export default function WhiteLabelPage() {
    const { register, handleSubmit, watch, setValue, reset, formState: { isDirty }, } = useForm({ defaultValues: DEFAULT_VALUES });
    const watchedValues = watch();
    // Load existing settings
    const { data: existing } = useQuery({
        queryKey: ['white-label-settings'],
        queryFn: () => api.get('/white-label/settings').then(r => r.data.data),
    });
    useEffect(() => {
        if (existing) {
            reset({ ...DEFAULT_VALUES, ...existing });
        }
    }, [existing, reset]);
    const saveMutation = useMutation({
        mutationFn: (dto) => api.post('/white-label/settings', dto).then(r => r.data),
        onSuccess: () => {
            toast.success('Settings saved', 'Your branding has been updated successfully.');
        },
        onError: () => {
            toast.error('Save failed', 'Could not save settings. Please try again.');
        },
    });
    function onSubmit(values) {
        saveMutation.mutate(values);
    }
    const inputClass = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white';
    const labelClass = 'block text-sm font-medium text-gray-700 mb-1';
    return (<div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Palette className="h-6 w-6 text-purple-600"/>
          White Label Settings
        </h1>
        <p className="text-sm text-gray-500 mt-1">Customize your platform's appearance</p>
      </div>

      {isDirty && (<div className="flex items-center justify-between gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 text-sm">
          <span className="text-amber-700 font-medium">You have unsaved changes</span>
          <div className="flex gap-2">
            <button type="button" onClick={() => reset({ ...DEFAULT_VALUES, ...existing })} className="text-xs text-amber-600 hover:text-amber-800 underline">
              Discard
            </button>
          </div>
        </div>)}

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ── Left: Form ──────────────────────────────────────────────── */}
          <div className="space-y-5">
            {/* Brand Name */}
            <Card>
              <CardHeader><CardTitle>Brand Identity</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className={labelClass}>Brand Name</label>
                  <input {...register('brandName')} type="text" className={inputClass} placeholder="My School"/>
                </div>
                <div>
                  <label className={labelClass}>Custom Domain</label>
                  <input {...register('customDomain')} type="text" className={inputClass} placeholder="app.yourschool.com"/>
                </div>
                <div>
                  <label className={labelClass}>Email From</label>
                  <input {...register('emailFrom')} type="text" className={inputClass} placeholder="noreply@yourschool.com"/>
                </div>
              </CardContent>
            </Card>

            {/* Logo & Favicon */}
            <Card>
              <CardHeader><CardTitle>Logo &amp; Favicon</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className={labelClass}>Logo URL</label>
                  <input {...register('logoUrl')} type="text" className={inputClass} placeholder="https://cdn.example.com/logo.png"/>
                  {watchedValues.logoUrl && isValidUrl(watchedValues.logoUrl) && (<div className="mt-2 p-2 border border-gray-100 rounded-lg inline-block bg-gray-50">
                      <img src={watchedValues.logoUrl} alt="Logo preview" className="h-10 object-contain" onError={e => { e.target.style.display = 'none'; }}/>
                    </div>)}
                </div>
                <div>
                  <label className={labelClass}>Favicon URL</label>
                  <input {...register('faviconUrl')} type="text" className={inputClass} placeholder="https://cdn.example.com/favicon.ico"/>
                </div>
              </CardContent>
            </Card>

            {/* Colors */}
            <Card>
              <CardHeader><CardTitle>Brand Colors</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className={labelClass}>Primary Color</label>
                  <div className="flex gap-2">
                    <input type="color" value={watchedValues.primaryColor} onChange={e => setValue('primaryColor', e.target.value, { shouldDirty: true })} className="h-9 w-12 rounded border border-gray-200 cursor-pointer p-0.5"/>
                    <input {...register('primaryColor')} type="text" className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Secondary Color</label>
                  <div className="flex gap-2">
                    <input type="color" value={watchedValues.secondaryColor} onChange={e => setValue('secondaryColor', e.target.value, { shouldDirty: true })} className="h-9 w-12 rounded border border-gray-200 cursor-pointer p-0.5"/>
                    <input {...register('secondaryColor')} type="text" className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Custom CSS */}
            <Card>
              <CardHeader><CardTitle>Custom CSS</CardTitle></CardHeader>
              <CardContent>
                <textarea {...register('customCss')} rows={6} placeholder="/* Override styles here */" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"/>
              </CardContent>
            </Card>

            <Button type="submit" loading={saveMutation.isPending} disabled={!isDirty && !saveMutation.isPending} className="w-full">
              Save Settings
            </Button>
          </div>

          {/* ── Right: Live Preview ─────────────────────────────────────── */}
          <div className="lg:sticky lg:top-6 self-start">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-gray-500"/>
                  Live Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <WhiteLabelPreview values={{
            brandName: watchedValues.brandName,
            logoUrl: watchedValues.logoUrl,
            faviconUrl: watchedValues.faviconUrl,
            primaryColor: watchedValues.primaryColor,
            secondaryColor: watchedValues.secondaryColor,
            customDomain: watchedValues.customDomain,
            customCss: watchedValues.customCss,
        }}/>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>);
}
