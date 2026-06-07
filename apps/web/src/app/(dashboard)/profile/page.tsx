'use client';

import React, { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Lock, Bell, Smartphone, Shield, Camera, Save } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'security', label: 'Security', icon: Lock },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'devices', label: 'Devices', icon: Smartphone },
];

export default function ProfilePage() {
  const [tab, setTab] = useState('profile');
  const { user, updateUser } = useAuthStore();
  const qc = useQueryClient();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [avatarUploading, setAvatarUploading] = useState(false);

  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    phone: '',
    bio: '',
    timezone: 'UTC',
    language: 'en',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const { data: profile } = useQuery({
    queryKey: ['my-profile'],
    queryFn: () => api.get('/users/me').then(r => r.data.data),
  });

  React.useEffect(() => {
    if (profile) {
      setProfileForm({
        firstName: profile.firstName ?? '',
        lastName: profile.lastName ?? '',
        phone: profile.phone ?? '',
        bio: profile.profile?.bio ?? '',
        timezone: profile.profile?.timezone ?? 'UTC',
        language: profile.profile?.language ?? 'en',
      });
      if (profile.profile?.avatarUrl) setAvatarUrl(profile.profile.avatarUrl);
    }
  }, [profile]);

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return;
    setAvatarUploading(true);
    try {
      const { data: presigned } = await api.post('/storage/presigned-url', {
        filename: file.name,
        contentType: file.type || 'image/jpeg',
        folder: 'avatars',
      });
      const { uploadUrl, publicUrl } = presigned.data ?? presigned;
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', uploadUrl, true);
        xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
        xhr.onload = () => xhr.status < 300 ? resolve() : reject(new Error('Upload failed'));
        xhr.onerror = () => reject(new Error('Network error'));
        xhr.send(file);
      });
      await api.patch('/users/me', { avatarUrl: publicUrl });
      setAvatarUrl(publicUrl);
      qc.invalidateQueries({ queryKey: ['my-profile'] });
    } finally {
      setAvatarUploading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const { data: devices } = useQuery({
    queryKey: ['my-devices'],
    queryFn: () => api.get('/users/me/devices').then(r => r.data.data),
    enabled: tab === 'devices',
  });

  const { data: mfaSetup, refetch: refetchMfa } = useQuery({
    queryKey: ['mfa-setup'],
    queryFn: () => api.post('/auth/mfa/setup').then(r => r.data.data),
    enabled: false,
  });

  const profileMutation = useMutation({
    mutationFn: (dto: typeof profileForm) => api.patch('/users/me', dto).then(r => r.data.data),
    onSuccess: (data) => {
      updateUser({ firstName: data.firstName, lastName: data.lastName });
      qc.invalidateQueries({ queryKey: ['my-profile'] });
    },
  });

  const passwordMutation = useMutation({
    mutationFn: (dto: { currentPassword: string; newPassword: string }) =>
      api.post('/auth/change-password', dto).then(r => r.data),
    onSuccess: () => setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' }),
  });

  const revokeDeviceMutation = useMutation({
    mutationFn: (deviceId: string) => api.delete(`/users/me/devices/${deviceId}`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-devices'] }),
  });

  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase();

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your personal information and account settings</p>
      </div>

      {/* Avatar + name header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarFileChange} />
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="h-20 w-20 rounded-full object-cover" />
              ) : (
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                  {initials}
                </div>
              )}
              <button
                type="button"
                disabled={avatarUploading}
                onClick={() => avatarInputRef.current?.click()}
                className="absolute bottom-0 right-0 h-6 w-6 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50"
              >
                {avatarUploading
                  ? <svg className="h-3 w-3 animate-spin text-gray-500" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  : <Camera className="h-3 w-3 text-gray-600" />
                }
              </button>
            </div>
            <div>
              <p className="text-xl font-semibold text-gray-900">{user?.firstName} {user?.lastName}</p>
              <p className="text-sm text-gray-500">{user?.email}</p>
              <span className="mt-1 inline-block px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                {user?.role?.replace(/_/g, ' ')}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-44 flex-shrink-0">
          <nav className="space-y-1">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={cn('w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors',
                  tab === t.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-100'
                )}>
                <t.icon className="h-4 w-4" />
                {t.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {tab === 'profile' && (
            <Card>
              <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input type="text" value={profileForm.firstName}
                      onChange={e => setProfileForm(f => ({ ...f, firstName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input type="text" value={profileForm.lastName}
                      onChange={e => setProfileForm(f => ({ ...f, lastName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input type="tel" value={profileForm.phone}
                    onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                  <textarea rows={3} value={profileForm.bio}
                    onChange={e => setProfileForm(f => ({ ...f, bio: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                    <select value={profileForm.language}
                      onChange={e => setProfileForm(f => ({ ...f, language: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="en">English</option>
                      <option value="fr">French</option>
                      <option value="ar">Arabic</option>
                      <option value="es">Spanish</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                    <select value={profileForm.timezone}
                      onChange={e => setProfileForm(f => ({ ...f, timezone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">America/New_York</option>
                      <option value="Europe/London">Europe/London</option>
                      <option value="Asia/Dubai">Asia/Dubai</option>
                      <option value="Asia/Karachi">Asia/Karachi</option>
                    </select>
                  </div>
                </div>
                <Button leftIcon={<Save className="h-4 w-4" />}
                  onClick={() => profileMutation.mutate(profileForm)}
                  loading={profileMutation.isPending}>
                  Save Changes
                </Button>
                {profileMutation.isSuccess && (
                  <p className="text-sm text-green-600">Profile updated successfully.</p>
                )}
              </CardContent>
            </Card>
          )}

          {tab === 'security' && (
            <div className="space-y-4">
              <Card>
                <CardHeader><CardTitle>Change Password</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <input type="password" placeholder="Current password" value={passwordForm.currentPassword}
                    onChange={e => setPasswordForm(f => ({ ...f, currentPassword: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <input type="password" placeholder="New password (min 8 chars, must include uppercase, number, symbol)"
                    value={passwordForm.newPassword}
                    onChange={e => setPasswordForm(f => ({ ...f, newPassword: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <input type="password" placeholder="Confirm new password" value={passwordForm.confirmPassword}
                    onChange={e => setPasswordForm(f => ({ ...f, confirmPassword: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  {passwordForm.newPassword && passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
                    <p className="text-xs text-red-500">Passwords do not match.</p>
                  )}
                  <Button
                    onClick={() => passwordMutation.mutate({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword })}
                    loading={passwordMutation.isPending}
                    disabled={!passwordForm.currentPassword || !passwordForm.newPassword || passwordForm.newPassword !== passwordForm.confirmPassword}>
                    Update Password
                  </Button>
                  {passwordMutation.isSuccess && <p className="text-sm text-green-600">Password updated successfully.</p>}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-blue-600" />Two-Factor Authentication</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        {user?.mfaEnabled ? '2FA is enabled on your account.' : 'Add an extra layer of security by enabling 2FA.'}
                      </p>
                    </div>
                    <Button variant={user?.mfaEnabled ? 'destructive' : 'default'} size="sm"
                      onClick={() => !user?.mfaEnabled && refetchMfa()}>
                      {user?.mfaEnabled ? 'Disable 2FA' : 'Enable 2FA'}
                    </Button>
                  </div>
                  {mfaSetup && !user?.mfaEnabled && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-3">
                      <p className="text-sm font-medium text-gray-700">Scan this QR code with your authenticator app:</p>
                      <img src={mfaSetup.qrCodeUrl} alt="MFA QR Code" className="w-40 h-40" />
                      <p className="text-xs text-gray-500 font-mono">{mfaSetup.secret}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {tab === 'devices' && (
            <Card>
              <CardHeader><CardTitle>Active Devices</CardTitle></CardHeader>
              <CardContent>
                <div className="divide-y divide-gray-100">
                  {(devices ?? []).map((device: any) => (
                    <div key={device.id} className="py-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{device.deviceName ?? 'Unknown Device'}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{device.deviceType} · {device.os} · {device.browser}</p>
                        <p className="text-xs text-gray-400 mt-0.5">Last active: {device.lastActiveAt ? new Date(device.lastActiveAt).toLocaleString() : 'Never'}</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => revokeDeviceMutation.mutate(device.deviceId)}>Revoke</Button>
                    </div>
                  ))}
                  {!devices?.length && <p className="py-4 text-sm text-gray-400">No devices found.</p>}
                </div>
              </CardContent>
            </Card>
          )}

          {tab === 'notifications' && (
            <Card>
              <CardHeader><CardTitle>Notification Preferences</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: 'Email notifications', desc: 'Receive important updates via email', key: 'email' },
                  { label: 'Push notifications', desc: 'Browser push notifications for real-time alerts', key: 'push' },
                  { label: 'Course updates', desc: 'Notify me when courses are updated', key: 'courseUpdates' },
                  { label: 'Assignment reminders', desc: 'Remind me of upcoming due dates', key: 'assignments' },
                  { label: 'Live session reminders', desc: 'Remind me 15 minutes before live sessions', key: 'liveSessions' },
                  { label: 'Achievement alerts', desc: 'Notify me when I earn achievements', key: 'achievements' },
                ].map(pref => (
                  <div key={pref.key} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{pref.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{pref.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-10 h-5 bg-gray-200 peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-5 peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
                    </label>
                  </div>
                ))}
                <Button>Save Preferences</Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
