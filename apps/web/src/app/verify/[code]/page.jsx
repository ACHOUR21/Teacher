'use client';
import { format } from 'date-fns';
import { Award, CheckCircle, XCircle, Loader2, Calendar, BookOpen, User } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
export default function VerifyCertificatePage() {
    const params = useParams();
    const code = params.code;
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? '/api';
        fetch(`${apiUrl}/certificates/verify/${code}`)
            .then(async (res) => {
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.message ?? 'Certificate not found');
            }
            return res.json();
        })
            .then(setResult)
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, [code]);
    return (<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-blue-600 font-bold text-xl mb-1">
            <Award className="h-6 w-6"/>
            EduAI Ultimate
          </div>
          <p className="text-sm text-gray-500">Certificate Verification</p>
        </div>

        {loading && (<div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-10 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-3"/>
            <p className="text-gray-500">Verifying certificate...</p>
          </div>)}

        {!loading && error && (<div className="bg-white rounded-2xl shadow-lg border border-red-100 p-10 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4"/>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Invalid Certificate</h2>
            <p className="text-gray-500 text-sm">{error}</p>
            <p className="text-gray-400 text-xs mt-4 font-mono break-all">Code: {code}</p>
          </div>)}

        {!loading && result && (<div className="bg-white rounded-2xl shadow-lg border border-green-100 overflow-hidden">
            {/* Green banner */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-5 text-white text-center">
              <CheckCircle className="h-10 w-10 mx-auto mb-2 opacity-90"/>
              <h2 className="text-lg font-bold">Certificate Verified</h2>
              <p className="text-green-100 text-sm mt-0.5">This is a genuine EduAI credential</p>
            </div>

            {/* Details */}
            <div className="p-6 space-y-4">
              <DetailRow icon={<User className="h-4 w-4 text-gray-400"/>} label="Recipient" value={result.recipientName}/>
              {result.course && (<DetailRow icon={<BookOpen className="h-4 w-4 text-gray-400"/>} label="Course" value={result.course}/>)}
              <DetailRow icon={<Award className="h-4 w-4 text-gray-400"/>} label="Certificate" value={result.templateName}/>
              <DetailRow icon={<Calendar className="h-4 w-4 text-gray-400"/>} label="Issued On" value={format(new Date(result.issuedAt), 'MMMM d, yyyy')}/>
              <div className="pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-400 mb-1">Credential ID</p>
                <p className="font-mono text-xs text-gray-600 break-all bg-gray-50 px-3 py-2 rounded-lg">
                  {result.verifyCode}
                </p>
              </div>
            </div>

            <div className="px-6 pb-6 text-center">
              <p className="text-xs text-gray-400">
                Verified by EduAI Ultimate · {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>)}
      </div>
    </div>);
}
function DetailRow({ icon, label, value }) {
    return (<div className="flex items-start gap-3">
      <div className="mt-0.5">{icon}</div>
      <div>
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-sm font-semibold text-gray-900 mt-0.5">{value}</p>
      </div>
    </div>);
}
