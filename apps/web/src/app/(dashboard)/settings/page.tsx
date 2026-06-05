'use client';

import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Settings, Palette, Bell, Shield, Key, Building } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

const TABS = [
  { id: 'general', label: 'General', icon: Building },
  { id: 'branding', label: 'White Label', icon: Palette },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'api', label: 'API Keys', icon: Key },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [brandForm, setBrandForm] = useState({ brandName: '', primaryColor: '#2563EB', secondaryColor: '#7C3AED' });
  const [newKeyForm, setNewKeyForm] = useState({ name: '', scopes: ['read'] });

  const { data: wlSettings } = useQuery({
    queryKey: ['white-label'],
    queryFn: () => api.get('/white-label/settings').then(r => r.data.data),
  });

  React.useEffect(() => {
    if (wlSettings) setBrandForm({ brandName: wlSettings.brandName, primaryColor: wlSettings.primaryColor, secondaryColor: wlSettings.secondaryColor });
  }, [wlSettings]);

  const { data: apiKeys, refetch: refetchKeys } = useQuery({
    queryKey: ['api-keys'],
    queryFn: () => api.get('/api-ecosystem/keys').then(r => r.data.data),
  });

  const brandMutation = useMutation({
    mutationFn: (dto: any) => api.put('/white-label/settings', dto).then(r => r.data.data),
  });

  const createKeyMutation = useMutation({
    mutationFn: (dto: any) => api.post('/api-ecosystem/keys', dto).then(r => r.data.data),
    onSuccess: () => refetchKeys(),
  });

  const revokeKeyMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api-ecosystem/keys/${id}`).then(r => r.data.data),
    onSuccess: () => refetchKeys(),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your platform configuration</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-52 flex-shrink-0">
          <nav className="space-y-1">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn('w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors',
                  activeTab === tab.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {activeTab === 'branding' && (
            <Card>
              <CardHeader><CardTitle>White Label Branding</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Brand Name</label>
                  <input type="text" value={brandForm.brandName} onChange={e => setBrandForm(f => ({ ...f, brandName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Primary Color</label>
                    <div className="flex gap-2">
                      <input type="color" value={brandForm.primaryColor} onChange={e => setBrandForm(f => ({ ...f, primaryColor: e.target.value }))}
                        className="h-9 w-12 rounded border border-gray-200 cursor-pointer" />
                      <input type="text" value={brandForm.primaryColor} onChange={e => setBrandForm(f => ({ ...f, primaryColor: e.target.value }))}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Color</label>
                    <div className="flex gap-2">
                      <input type="color" value={brandForm.secondaryColor} onChange={e => setBrandForm(f => ({ ...f, secondaryColor: e.target.value }))}
                        className="h-9 w-12 rounded border border-gray-200 cursor-pointer" />
                      <input type="text" value={brandForm.secondaryColor} onChange={e => setBrandForm(f => ({ ...f, secondaryColor: e.target.value }))}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                    </div>
                  </div>
                </div>
                <Button onClick={() => brandMutation.mutate(brandForm)} loading={brandMutation.isPending}>Save Changes</Button>
              </CardContent>
            </Card>
          )}

          {activeTab === 'api' && (
            <Card>
              <CardHeader><CardTitle>API Keys</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <input type="text" placeholder="Key name (e.g. Production Integration)" value={newKeyForm.name}
                    onChange={e => setNewKeyForm(f => ({ ...f, name: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <Button onClick={() => createKeyMutation.mutate(newKeyForm)} loading={createKeyMutation.isPending}>Create Key</Button>
                </div>
                <div className="divide-y divide-gray-100">
                  {(apiKeys ?? []).map((key: any) => (
                    <div key={key.id} className="py-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{key.name}</p>
                        <p className="text-xs text-gray-500 font-mono mt-0.5">{key.keyPrefix}••••••••••••</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {key.scopes.join(', ')} · {key.rateLimit}/hr
                          {key.lastUsedAt && ` · Last used ${new Date(key.lastUsedAt).toLocaleDateString()}`}
                        </p>
                      </div>
                      <Button variant="destructive" size="sm" onClick={() => revokeKeyMutation.mutate(key.id)}>Revoke</Button>
                    </div>
                  ))}
                  {!apiKeys?.length && <p className="py-4 text-sm text-gray-400">No API keys yet</p>}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'general' && (
            <Card>
              <CardHeader><CardTitle>General Settings</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Institution Name</label>
                  <input type="text" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="Your institution name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Default Language</label>
                  <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
                    <option value="en">English</option>
                    <option value="fr">French</option>
                    <option value="ar">Arabic</option>
                    <option value="es">Spanish</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                  <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
                    <option>UTC</option>
                    <option>America/New_York</option>
                    <option>Europe/London</option>
                    <option>Asia/Dubai</option>
                  </select>
                </div>
                <Button>Save Changes</Button>
              </CardContent>
            </Card>
          )}

          {activeTab === 'security' && (
            <Card>
              <CardHeader><CardTitle>Security Settings</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Two-Factor Authentication</p>
                    <p className="text-xs text-gray-500 mt-0.5">Add an extra layer of security to your account</p>
                  </div>
                  <Button variant="outline" size="sm">Enable MFA</Button>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Active Sessions</p>
                    <p className="text-xs text-gray-500 mt-0.5">Manage devices where you're signed in</p>
                  </div>
                  <Button variant="outline" size="sm">View Sessions</Button>
                </div>
                <div className="space-y-3">
                  <p className="font-medium text-gray-900 text-sm">Change Password</p>
                  <input type="password" placeholder="Current password" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                  <input type="password" placeholder="New password" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                  <input type="password" placeholder="Confirm new password" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                  <Button>Update Password</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
