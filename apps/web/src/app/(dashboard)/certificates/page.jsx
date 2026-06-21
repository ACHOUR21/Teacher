'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Award, Download, Calendar, BookOpen, Search, Shield, Crown, Plus, X, Eye, FileText, } from 'lucide-react';
import { useState } from 'react';

import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
const BORDER_STYLES = ['none', 'single', 'double', 'ornate'];
// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CertificatesPage() {
    const [activeTab, setActiveTab] = useState('issued');
    return (<div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Certificates</h1>
          <p className="text-sm text-gray-500 mt-1">Manage issued certificates and templates</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {['issued', 'templates'].map(tab => (<button key={tab} onClick={() => setActiveTab(tab)} className={cn('px-4 py-2 text-sm font-medium rounded-md transition-colors capitalize', activeTab === tab
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700')}>
            {tab === 'issued' ? 'Issued Certificates' : 'Templates'}
          </button>))}
      </div>

      {activeTab === 'issued' ? <IssuedCertificatesSection /> : <TemplatesSection />}
    </div>);
}
// ─── Issued Certificates Section ──────────────────────────────────────────────
function IssuedCertificatesSection() {
    const [search, setSearch] = useState('');
    const { data, isLoading } = useQuery({
        queryKey: ['certificates'],
        queryFn: () => api.get('/certificates/my').then(r => r.data.data ?? r.data),
    });
    const certificates = (data ?? []).filter(c => {
        if (!search) {
            return true;
        }
        const name = c.template?.name?.toLowerCase() ?? '';
        const course = c.enrollment?.course?.title?.toLowerCase() ?? '';
        return name.includes(search.toLowerCase()) || course.includes(search.toLowerCase());
    });
    return (<div className="space-y-5">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"/>
        <input type="text" placeholder="Search certificates..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
      </div>

      {isLoading ? (<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (<div key={i} className="h-48 bg-gray-100 rounded-2xl animate-pulse"/>))}
        </div>) : certificates.length === 0 ? (<EmptyIssuedState searched={!!search}/>) : (<>
          {/* Card Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {certificates.map(cert => (<CertificateCard key={cert.id} cert={cert}/>))}
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 text-sm">All Issued Certificates</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {['Recipient', 'Course', 'Template', 'Issued Date', 'Verification Code', 'Actions'].map(h => (<th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        {h}
                      </th>))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {certificates.map(cert => (<IssuedCertificateRow key={cert.id} cert={cert}/>))}
                </tbody>
              </table>
            </div>
          </div>
        </>)}
    </div>);
}
function IssuedCertificateRow({ cert }) {
    const recipientName = cert.student?.user
        ? `${cert.student.user.firstName} ${cert.student.user.lastName}`
        : '—';
    const course = cert.enrollment?.course?.title ?? cert.template?.course?.title ?? '—';
    const templateName = cert.template?.name ?? '—';
    const issuedAt = cert.issuedAt ? format(new Date(cert.issuedAt), 'MMM d, yyyy') : '—';
    const downloadUrl = `/certificates/${cert.id}/download`;
    return (<tr className="hover:bg-gray-50">
      <td className="px-4 py-3 font-medium text-gray-900">{recipientName}</td>
      <td className="px-4 py-3 text-gray-600">{course}</td>
      <td className="px-4 py-3 text-gray-600">{templateName}</td>
      <td className="px-4 py-3 text-gray-500">{issuedAt}</td>
      <td className="px-4 py-3">
        {cert.verifyCode ? (<span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
            {cert.verifyCode}
          </span>) : '—'}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <a href={downloadUrl} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
            <Download className="h-3.5 w-3.5"/> Download
          </a>
          {cert.verifyCode && (<a href={`/verify/${cert.verifyCode}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-medium">
              <Shield className="h-3.5 w-3.5"/> Verify
            </a>)}
        </div>
      </td>
    </tr>);
}
// ─── Templates Section ────────────────────────────────────────────────────────
function TemplatesSection() {
    const [showEditor, setShowEditor] = useState(false);
    const [issueTarget, setIssueTarget] = useState(null);
    const { data, isLoading } = useQuery({
        queryKey: ['certificate-templates'],
        queryFn: () => api.get('/certificates/templates').then(r => r.data.data ?? r.data),
    });
    const templates = data ?? [];
    return (<div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{templates.length} template{templates.length !== 1 ? 's' : ''}</p>
        <button onClick={() => setShowEditor(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="h-4 w-4"/> Create Template
        </button>
      </div>

      {isLoading ? (<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (<div key={i} className="h-56 bg-gray-100 rounded-2xl animate-pulse"/>))}
        </div>) : templates.length === 0 ? (<EmptyTemplatesState onCreate={() => setShowEditor(true)}/>) : (<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {templates.map(t => (<TemplateCard key={t.id} template={t} onIssue={() => setIssueTarget(t)}/>))}
        </div>)}

      {showEditor && (<TemplateEditorModal onClose={() => setShowEditor(false)}/>)}

      {issueTarget && (<IssueCertificateModal template={issueTarget} onClose={() => setIssueTarget(null)}/>)}
    </div>);
}
function TemplateCard({ template, onIssue, }) {
    const bg = template.design?.backgroundColor ?? '#1e3a5f';
    const tc = template.design?.textColor ?? '#ffffff';
    const issued = template._count?.issued ?? 0;
    const description = template.design?.bodyText ?? template.design?.title ?? 'Certificate template';
    return (<div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Preview Rectangle */}
      <div className="relative h-36 flex flex-col items-center justify-center gap-1 overflow-hidden" style={{ backgroundColor: bg }}>
        <TemplateBorderOverlay borderStyle={template.design?.borderStyle}/>
        <Crown className="h-8 w-8 mb-1" style={{ color: tc }}/>
        <p className="text-xs font-bold tracking-widest uppercase" style={{ color: tc }}>
          {template.design?.title ?? 'Certificate'}
        </p>
        <div className="absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full bg-black/20 text-white">
          {issued} issued
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-gray-900 text-sm mb-1 truncate">{template.name}</h3>
        <p className="text-xs text-gray-500 line-clamp-2 mb-4">{description}</p>

        <button onClick={onIssue} className="w-full flex items-center justify-center gap-1.5 py-2 bg-blue-600 rounded-lg text-xs font-medium text-white hover:bg-blue-700 transition-colors">
          <Award className="h-3.5 w-3.5"/> Issue Certificate
        </button>
      </div>
    </div>);
}
function TemplateBorderOverlay({ borderStyle }) {
    if (!borderStyle || borderStyle === 'none') {
        return null;
    }
    if (borderStyle === 'single') {
        return <div className="absolute inset-2 border-2 border-white/30 rounded pointer-events-none"/>;
    }
    if (borderStyle === 'double') {
        return (<>
        <div className="absolute inset-2 border-2 border-white/30 rounded pointer-events-none"/>
        <div className="absolute inset-4 border border-white/20 rounded pointer-events-none"/>
      </>);
    }
    if (borderStyle === 'ornate') {
        return (<>
        <div className="absolute inset-1 border-4 border-white/20 rounded pointer-events-none"/>
        <div className="absolute inset-3 border border-white/15 rounded pointer-events-none"/>
        <div className="absolute inset-[18px] border border-white/10 rounded pointer-events-none"/>
      </>);
    }
    return null;
}
// ─── Template Editor Modal ────────────────────────────────────────────────────
function TemplateEditorModal({ onClose }) {
    const queryClient = useQueryClient();
    const [form, setForm] = useState({
        name: '',
        title: 'Certificate of Achievement',
        bodyText: 'This is to certify that the recipient has successfully completed the course.',
        backgroundColor: '#1e3a5f',
        textColor: '#ffffff',
        borderStyle: 'single',
        showSignature: true,
    });
    const mutation = useMutation({
        mutationFn: (payload) => api.post('/certificates/templates', payload).then(r => r.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['certificate-templates'] });
            onClose();
        },
    });
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
    return (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Create Certificate Template</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="h-5 w-5 text-gray-500"/>
          </button>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 divide-x divide-gray-100">
            {/* Form */}
            <div className="p-6 space-y-5 overflow-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Template Name</label>
                <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Course Completion" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Title Text</label>
                <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Certificate of Achievement" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Body Text</label>
                <textarea value={form.bodyText} onChange={e => set('bodyText', e.target.value)} rows={3} placeholder="This is to certify that..." className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"/>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Background Color</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={form.backgroundColor} onChange={e => set('backgroundColor', e.target.value)} className="h-10 w-14 rounded border border-gray-200 cursor-pointer p-0.5"/>
                    <input value={form.backgroundColor} onChange={e => set('backgroundColor', e.target.value)} className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Text Color</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={form.textColor} onChange={e => set('textColor', e.target.value)} className="h-10 w-14 rounded border border-gray-200 cursor-pointer p-0.5"/>
                    <input value={form.textColor} onChange={e => set('textColor', e.target.value)} className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Border Style</label>
                <select value={form.borderStyle} onChange={e => set('borderStyle', e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  {BORDER_STYLES.map(s => (<option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>))}
                </select>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.showSignature} onChange={e => set('showSignature', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"/>
                <span className="text-sm font-medium text-gray-700">Show Signature Line</span>
              </label>
            </div>

            {/* Live Preview */}
            <div className="p-6 bg-gray-50">
              <div className="flex items-center gap-2 mb-4">
                <Eye className="h-4 w-4 text-gray-500"/>
                <p className="text-sm font-medium text-gray-700">Live Preview</p>
              </div>
              <CertificatePreview form={form}/>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
            Cancel
          </button>
          <button onClick={() => mutation.mutate(form)} disabled={!form.name.trim() || mutation.isPending} className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {mutation.isPending ? 'Saving...' : 'Save Template'}
          </button>
        </div>
      </div>
    </div>);
}
function CertificatePreview({ form }) {
    return (<div className="rounded-xl overflow-hidden shadow-lg aspect-[1.41/1] relative flex flex-col items-center justify-center p-6" style={{ backgroundColor: form.backgroundColor }}>
      {/* Border overlays */}
      {form.borderStyle !== 'none' && (<div className="absolute inset-3 border-2 rounded pointer-events-none" style={{ borderColor: `${form.textColor}40` }}/>)}
      {(form.borderStyle === 'double' || form.borderStyle === 'ornate') && (<div className="absolute inset-5 border rounded pointer-events-none" style={{ borderColor: `${form.textColor}25` }}/>)}
      {form.borderStyle === 'ornate' && (<div className="absolute inset-7 border rounded pointer-events-none" style={{ borderColor: `${form.textColor}15` }}/>)}

      <div className="relative text-center space-y-2 w-full">
        <Crown className="h-6 w-6 mx-auto" style={{ color: form.textColor }}/>
        <p className="text-sm font-bold tracking-widest uppercase" style={{ color: form.textColor }}>
          {form.title || 'Certificate of Achievement'}
        </p>
        <div className="w-12 h-px mx-auto" style={{ backgroundColor: `${form.textColor}50` }}/>
        <p className="text-xs leading-relaxed max-w-[80%] mx-auto" style={{ color: `${form.textColor}cc` }}>
          {form.bodyText || 'Certificate body text will appear here.'}
        </p>
        <p className="text-xs font-semibold" style={{ color: form.textColor }}>Recipient Name</p>
        {form.showSignature && (<div className="pt-3 flex justify-center gap-8">
            <div className="text-center">
              <div className="w-16 h-px" style={{ backgroundColor: `${form.textColor}60` }}/>
              <p className="text-xs mt-1" style={{ color: `${form.textColor}80` }}>Signature</p>
            </div>
          </div>)}
      </div>
    </div>);
}
// ─── Issue Certificate Modal ───────────────────────────────────────────────────
function IssueCertificateModal({ template, onClose, }) {
    const queryClient = useQueryClient();
    const [courseId, setCourseId] = useState('');
    const [recipientId, setRecipientId] = useState('');
    const { data: coursesData } = useQuery({
        queryKey: ['courses-select'],
        queryFn: () => api.get('/courses', { params: { limit: 100 } }).then(r => r.data.data),
    });
    const courses = coursesData ?? [];
    const mutation = useMutation({
        mutationFn: () => api.post('/certificates/issue-by-template', {
            templateId: template.id,
            courseId: courseId || undefined,
            recipientId,
        }).then(r => r.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['certificates'] });
            queryClient.invalidateQueries({ queryKey: ['certificate-templates'] });
            onClose();
        },
    });
    return (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Issue Certificate</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="h-5 w-5 text-gray-500"/>
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
            <FileText className="h-5 w-5 text-blue-600 flex-shrink-0"/>
            <div>
              <p className="text-sm font-medium text-blue-900">{template.name}</p>
              <p className="text-xs text-blue-600">{template.design?.title ?? 'Certificate'}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Select Course
            </label>
            <select value={courseId} onChange={e => setCourseId(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="">— Optional —</option>
              {courses.map(c => (<option key={c.id} value={c.id}>{c.title}</option>))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Student ID (Recipient)
            </label>
            <input value={recipientId} onChange={e => setRecipientId(e.target.value)} placeholder="Enter student ID..." className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
          </div>

          {mutation.isError && (<p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              Failed to issue certificate. Please check the details and try again.
            </p>)}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
            Cancel
          </button>
          <button onClick={() => mutation.mutate()} disabled={!recipientId.trim() || mutation.isPending} className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {mutation.isPending ? 'Issuing...' : 'Issue Certificate'}
          </button>
        </div>
      </div>
    </div>);
}
// ─── Certificate Card (existing) ──────────────────────────────────────────────
function CertificateCard({ cert }) {
    const courseName = cert.template?.course?.title ??
        cert.enrollment?.course?.title ??
        cert.template?.name ??
        'Course Certificate';
    const issuedAt = cert.issuedAt ? format(new Date(cert.issuedAt), 'MMM d, yyyy') : '—';
    const expiresAt = cert.expiresAt ? format(new Date(cert.expiresAt), 'MMM d, yyyy') : null;
    const isExpired = cert.expiresAt ? new Date(cert.expiresAt) < new Date() : false;
    const downloadUrl = `/api/certificates/${cert.id}/download`;
    return (<div className={cn('bg-white rounded-2xl border overflow-hidden shadow-sm hover:shadow-md transition-shadow', isExpired ? 'border-red-100' : 'border-gray-200')}>
      <div className="relative h-32 bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {[...Array(4)].map((_, i) => (<div key={i} className="absolute rounded-full border-2 border-white" style={{
                width: `${80 + i * 40}px`,
                height: `${80 + i * 40}px`,
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
            }}/>))}
        </div>
        <Award className="h-14 w-14 text-white/80"/>
        {isExpired ? (<div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">Expired</div>) : (<div className="absolute top-2 right-2 bg-green-500/90 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
            <Shield className="h-3 w-3"/> Valid
          </div>)}
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 mb-3">{courseName}</h3>

        <div className="space-y-1.5 mb-4">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Calendar className="h-3.5 w-3.5 flex-shrink-0"/>
            <span>Issued {issuedAt}</span>
          </div>
          {expiresAt && (<div className={cn('flex items-center gap-2 text-xs', isExpired ? 'text-red-500' : 'text-gray-500')}>
              <Calendar className="h-3.5 w-3.5 flex-shrink-0"/>
              <span>Expires {expiresAt}</span>
            </div>)}
          {cert.credentialId && (<div className="flex items-center gap-2 text-xs text-gray-400">
              <BookOpen className="h-3.5 w-3.5 flex-shrink-0"/>
              <span className="font-mono truncate">{cert.credentialId}</span>
            </div>)}
        </div>

        <div className="flex gap-2">
          <a href={downloadUrl} className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <Download className="h-3.5 w-3.5"/> Download
          </a>
          {cert.verifyCode && (<a href={`/verify/${cert.verifyCode}`} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-600 rounded-lg text-xs font-medium text-white hover:bg-blue-700 transition-colors">
              <Shield className="h-3.5 w-3.5"/> Verify
            </a>)}
        </div>
      </div>
    </div>);
}
// ─── Empty States ─────────────────────────────────────────────────────────────
function EmptyIssuedState({ searched }) {
    return (<div className="text-center py-20">
      <div className="h-16 w-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
        <Award className="h-8 w-8 text-blue-400"/>
      </div>
      <p className="text-gray-700 font-medium">
        {searched ? 'No certificates match your search' : 'No certificates yet'}
      </p>
      <p className="text-sm text-gray-400 mt-1">
        {searched ? 'Try a different search term' : 'Complete courses to earn certificates'}
      </p>
    </div>);
}
function EmptyTemplatesState({ onCreate }) {
    return (<div className="text-center py-20">
      <div className="h-16 w-16 rounded-full bg-purple-50 flex items-center justify-center mx-auto mb-4">
        <Crown className="h-8 w-8 text-purple-400"/>
      </div>
      <p className="text-gray-700 font-medium">No templates yet</p>
      <p className="text-sm text-gray-400 mt-1 mb-5">Create a template to start issuing certificates</p>
      <button onClick={onCreate} className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors">
        <Plus className="h-4 w-4"/> Create First Template
      </button>
    </div>);
}
