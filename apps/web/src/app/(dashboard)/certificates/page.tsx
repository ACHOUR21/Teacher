'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Award, Download, ExternalLink, Calendar, BookOpen, Search, Shield } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default function CertificatesPage() {
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['certificates'],
    queryFn: () => api.get('/certificates/my').then(r => r.data.data),
  });

  const certificates: any[] = ((data as any[]) ?? []).filter((c: any) => {
    if (!search) return true;
    const name = c.template?.name?.toLowerCase() ?? '';
    const course = c.enrollment?.course?.title?.toLowerCase() ?? '';
    return name.includes(search.toLowerCase()) || course.includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Certificates</h1>
          <p className="text-sm text-gray-500 mt-1">{(data as any[])?.length ?? 0} certificates earned</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search certificates..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : certificates.length === 0 ? (
        <EmptyState searched={!!search} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {certificates.map((cert: any) => (
            <CertificateCard key={cert.id} cert={cert} />
          ))}
        </div>
      )}
    </div>
  );
}

function CertificateCard({ cert }: { cert: any }) {
  const courseName = cert.enrollment?.course?.title ?? cert.template?.name ?? 'Course Certificate';
  const issuedAt = cert.issuedAt ? format(new Date(cert.issuedAt), 'MMM d, yyyy') : '—';
  const expiresAt = cert.expiresAt ? format(new Date(cert.expiresAt), 'MMM d, yyyy') : null;
  const isExpired = cert.expiresAt && new Date(cert.expiresAt) < new Date();

  return (
    <div className={cn(
      'bg-white rounded-2xl border overflow-hidden shadow-sm hover:shadow-md transition-shadow',
      isExpired ? 'border-red-100' : 'border-gray-200',
    )}>
      {/* Certificate Graphic */}
      <div className="relative h-32 bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full border-2 border-white"
              style={{
                width: `${80 + i * 40}px`,
                height: `${80 + i * 40}px`,
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
              }}
            />
          ))}
        </div>
        <Award className="h-14 w-14 text-white/80" />
        {isExpired && (
          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
            Expired
          </div>
        )}
        {!isExpired && (
          <div className="absolute top-2 right-2 bg-green-500/90 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
            <Shield className="h-3 w-3" /> Valid
          </div>
        )}
      </div>

      {/* Certificate Info */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 mb-3">
          {courseName}
        </h3>

        <div className="space-y-1.5 mb-4">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
            <span>Issued {issuedAt}</span>
          </div>
          {expiresAt && (
            <div className={cn('flex items-center gap-2 text-xs', isExpired ? 'text-red-500' : 'text-gray-500')}>
              <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
              <span>Expires {expiresAt}</span>
            </div>
          )}
          {cert.credentialId && (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <BookOpen className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="font-mono truncate">{cert.credentialId}</span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {cert.pdfUrl && (
            <a
              href={cert.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Download className="h-3.5 w-3.5" /> Download
            </a>
          )}
          {cert.verifyUrl && (
            <a
              href={cert.verifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-600 rounded-lg text-xs font-medium text-white hover:bg-blue-700 transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Verify
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ searched }: { searched: boolean }) {
  return (
    <div className="text-center py-20">
      <div className="h-16 w-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
        <Award className="h-8 w-8 text-blue-400" />
      </div>
      <p className="text-gray-700 font-medium">
        {searched ? 'No certificates match your search' : 'No certificates yet'}
      </p>
      <p className="text-sm text-gray-400 mt-1">
        {searched ? 'Try a different search term' : 'Complete courses to earn certificates'}
      </p>
    </div>
  );
}
