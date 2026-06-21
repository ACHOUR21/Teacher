'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Video, Clock, Users, Play } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { api } from '@/lib/api';
export default function LivePage() {
    const qc = useQueryClient();
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState({ title: '', scheduledAt: '', maxParticipants: 30 });
    const { data: sessions } = useQuery({
        queryKey: ['live-sessions'],
        queryFn: () => api.get('/live/sessions').then(r => r.data.data),
    });
    const createMutation = useMutation({
        mutationFn: (dto) => api.post('/live/sessions', dto).then(r => r.data.data),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['live-sessions'] }); setShowCreate(false); setForm({ title: '', scheduledAt: '', maxParticipants: 30 }); },
    });
    const startMutation = useMutation({
        mutationFn: (id) => api.patch(`/live/sessions/${id}/start`).then(r => r.data.data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['live-sessions'] }),
    });
    const upcoming = (sessions?.data ?? []).filter((s) => s.status === 'SCHEDULED');
    const live = (sessions?.data ?? []).filter((s) => s.status === 'LIVE');
    const past = (sessions?.data ?? []).filter((s) => s.status === 'ENDED');
    return (<div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Live Classroom</h1>
          <p className="text-sm text-gray-500 mt-1">Schedule and manage live sessions</p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4"/>} onClick={() => setShowCreate(true)}>Schedule Session</Button>
      </div>

      {/* Create Session Form */}
      {showCreate && (<Card>
          <CardContent className="pt-6 space-y-4">
            <h3 className="font-semibold text-gray-900">New Live Session</h3>
            <input type="text" placeholder="Session title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
            <input type="datetime-local" value={form.scheduledAt} onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
            <div className="flex gap-3">
              <Button onClick={() => createMutation.mutate(form)} loading={createMutation.isPending}>Create</Button>
              <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>)}

      {/* Live Now */}
      {live.length > 0 && (<div>
          <h2 className="text-sm font-semibold text-red-600 uppercase mb-3 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse"/> Live Now
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {live.map((s) => (<div key={s.id} className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{s.title}</p>
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1"><Users className="h-3 w-3"/>{s._count?.participants ?? 0} participants</p>
                  </div>
                  <Link href={`/live/${s.id}`}><Button size="sm" className="bg-red-600 hover:bg-red-700"><Play className="h-3 w-3 mr-1"/>Join</Button></Link>
                </div>
              </div>))}
          </div>
        </div>)}

      {/* Upcoming */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">Upcoming Sessions</h2>
        <div className="space-y-3">
          {upcoming.map((s) => (<div key={s.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Video className="h-5 w-5 text-blue-600"/>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{s.title}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                    <Clock className="h-3 w-3"/>{new Date(s.scheduledAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={() => startMutation.mutate(s.id)} loading={startMutation.isPending}>Start</Button>
            </div>))}
          {!upcoming.length && <p className="text-sm text-gray-400 py-4">No upcoming sessions</p>}
        </div>
      </div>

      {/* Past */}
      {past.length > 0 && (<div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">Past Sessions</h2>
          <div className="space-y-2">
            {past.slice(0, 5).map((s) => (<div key={s.id} className="bg-gray-50 rounded-lg p-3 flex items-center justify-between text-sm">
                <span className="text-gray-700">{s.title}</span>
                <span className="text-gray-400 text-xs">{new Date(s.scheduledAt).toLocaleDateString()}</span>
              </div>))}
          </div>
        </div>)}
    </div>);
}
