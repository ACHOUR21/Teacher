'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import {
  BookOpen, Search, Mic, Volume2, Briefcase, TrendingUp, AlertTriangle,
  ChevronRight, Loader2, CheckCircle, Download
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Tab = 'curriculum' | 'research' | 'stt' | 'tts' | 'career' | 'performance' | 'dropout';

const TABS: { id: Tab; label: string; icon: React.ComponentType<any>; description: string; roles?: string[] }[] = [
  { id: 'curriculum', label: 'Curriculum', icon: BookOpen, description: 'Generate full multi-week curricula' },
  { id: 'research', label: 'Research', icon: Search, description: 'AI-powered research assistant' },
  { id: 'stt', label: 'Speech-to-Text', icon: Mic, description: 'Transcribe audio recordings' },
  { id: 'tts', label: 'Text-to-Speech', icon: Volume2, description: 'Convert text to natural speech' },
  { id: 'career', label: 'Career Advisor', icon: Briefcase, description: 'Personalized career guidance' },
  { id: 'performance', label: 'Performance', icon: TrendingUp, description: 'Predict student performance', roles: ['SUPER_ADMIN', 'ADMIN', 'SCHOOL_ADMIN', 'TEACHER'] },
  { id: 'dropout', label: 'Dropout Risk', icon: AlertTriangle, description: 'Identify at-risk students', roles: ['SUPER_ADMIN', 'ADMIN', 'SCHOOL_ADMIN', 'TEACHER'] },
];

function CurriculumTab() {
  const [subject, setSubject] = useState('');
  const [gradeLevel, setGradeLevel] = useState('Grade 9');
  const [weeks, setWeeks] = useState(8);
  const [objectives, setObjectives] = useState('');
  const [result, setResult] = useState<any>(null);

  const mutation = useMutation({
    mutationFn: () => api.post('/ai/curriculum/generate', {
      subject, gradeLevel, weeks,
      objectives: objectives.split('\n').map(o => o.trim()).filter(Boolean),
    }).then(r => r.data.data),
    onSuccess: (data) => setResult(data.curriculum),
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Subject</label>
          <input
            value={subject} onChange={e => setSubject(e.target.value)}
            placeholder="e.g. Algebra, World History, Biology..."
            className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Grade Level</label>
          <select
            value={gradeLevel} onChange={e => setGradeLevel(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {['Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12', 'Undergraduate', 'Graduate'].map(g => (
              <option key={g}>{g}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Duration (weeks)</label>
          <input
            type="number" min={2} max={52} value={weeks} onChange={e => setWeeks(+e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Learning Objectives (one per line)</label>
          <textarea
            value={objectives} onChange={e => setObjectives(e.target.value)} rows={3}
            placeholder="Understand quadratic equations&#10;Apply the Pythagorean theorem&#10;..."
            className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
        </div>
      </div>
      <Button onClick={() => mutation.mutate()} disabled={!subject || mutation.isPending} className="w-full">
        {mutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Generating Curriculum...</> : 'Generate Curriculum'}
      </Button>

      {result && (
        <div className="border border-border rounded-xl overflow-hidden">
          <div className="bg-primary/5 px-4 py-3 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground">{result.title}</h3>
              <p className="text-xs text-muted-foreground">{result.subject} · {result.gradeLevel} · {result.totalWeeks} weeks</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => {
              const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
              const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
              a.download = `curriculum-${result.subject}.json`; a.click();
            }}>
              <Download className="h-3.5 w-3.5 mr-1" />Export
            </Button>
          </div>
          <div className="divide-y divide-border max-h-[480px] overflow-y-auto">
            {result.weeks?.map((w: any) => (
              <div key={w.week} className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center">{w.week}</span>
                  <span className="font-medium text-foreground text-sm">{w.theme}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 ml-8">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Topics</p>
                    <ul className="space-y-0.5">{w.topics?.map((t: string, i: number) => <li key={i} className="text-xs text-foreground flex gap-1"><ChevronRight className="h-3 w-3 shrink-0 mt-0.5 text-primary" />{t}</li>)}</ul>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Activities</p>
                    <ul className="space-y-0.5">{w.activities?.map((a: string, i: number) => <li key={i} className="text-xs text-foreground flex gap-1"><CheckCircle className="h-3 w-3 shrink-0 mt-0.5 text-green-500" />{a}</li>)}</ul>
                  </div>
                </div>
                <p className="ml-8 mt-2 text-xs text-muted-foreground"><span className="font-medium">Assessment:</span> {w.assessment}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ResearchTab() {
  const [topic, setTopic] = useState('');
  const [depth, setDepth] = useState<'overview' | 'detailed' | 'academic'>('detailed');
  const [result, setResult] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | undefined>();

  const mutation = useMutation({
    mutationFn: () => api.post('/ai/research/assist', { topic, depth, conversationId }).then(r => r.data.data),
    onSuccess: (data) => {
      setResult(data.result);
      if (!conversationId) setConversationId(data.conversationId);
    },
  });

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Research Topic</label>
        <textarea
          value={topic} onChange={e => setTopic(e.target.value)} rows={3}
          placeholder="Enter a research topic or question..."
          className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Research Depth</label>
        <div className="grid grid-cols-3 gap-2">
          {(['overview', 'detailed', 'academic'] as const).map(d => (
            <button
              key={d} onClick={() => setDepth(d)}
              className={cn('px-3 py-2 rounded-lg text-sm font-medium border transition-colors capitalize', depth === d ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:bg-accent')}
            >
              {d}
            </button>
          ))}
        </div>
      </div>
      <Button onClick={() => mutation.mutate()} disabled={!topic || mutation.isPending} className="w-full">
        {mutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Researching...</> : 'Start Research'}
      </Button>
      {result && (
        <div className="border border-border rounded-xl p-4 bg-muted/30 max-h-[480px] overflow-y-auto">
          <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap text-sm leading-relaxed">{result}</div>
        </div>
      )}
    </div>
  );
}

function SpeechToTextTab() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [language, setLanguage] = useState('en');

  const mutation = useMutation({
    mutationFn: async () => {
      const arrayBuffer = await file!.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      return api.post('/ai/speech-to-text', { audioBase64: base64, language }).then(r => r.data.data);
    },
    onSuccess: (data) => setResult(data.transcript),
  });

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Language</label>
        <select
          value={language} onChange={e => setLanguage(e.target.value)}
          className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="en">English</option>
          <option value="fr">French</option>
          <option value="es">Spanish</option>
          <option value="de">German</option>
          <option value="ar">Arabic</option>
          <option value="zh">Chinese</option>
          <option value="ja">Japanese</option>
          <option value="pt">Portuguese</option>
        </select>
      </div>
      <div
        className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary transition-colors"
        onClick={() => document.getElementById('audio-upload')?.click()}
      >
        <Mic className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
        <p className="text-sm font-medium text-foreground">{file ? file.name : 'Click to upload audio file'}</p>
        <p className="text-xs text-muted-foreground mt-1">MP3, WAV, WebM, M4A supported</p>
        <input id="audio-upload" type="file" accept="audio/*" className="hidden" onChange={e => setFile(e.target.files?.[0] ?? null)} />
      </div>
      <Button onClick={() => mutation.mutate()} disabled={!file || mutation.isPending} className="w-full">
        {mutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Transcribing...</> : 'Transcribe Audio'}
      </Button>
      {result && (
        <div className="border border-border rounded-xl p-4 bg-muted/30">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase">Transcript</p>
            <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(result)}>Copy</Button>
          </div>
          <p className="text-sm text-foreground leading-relaxed">{result}</p>
        </div>
      )}
    </div>
  );
}

function TextToSpeechTab() {
  const [text, setText] = useState('');
  const [voice, setVoice] = useState<'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer'>('nova');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const VOICES = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'] as const;

  const mutation = useMutation({
    mutationFn: () => api.post('/ai/text-to-speech', { text, voice }).then(r => r.data.data),
    onSuccess: (data) => {
      const bytes = Uint8Array.from(atob(data.audioBase64), c => c.charCodeAt(0));
      const blob = new Blob([bytes], { type: 'audio/mpeg' });
      setAudioUrl(URL.createObjectURL(blob));
    },
  });

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Text</label>
        <textarea
          value={text} onChange={e => setText(e.target.value)} rows={5}
          placeholder="Enter the text you want to convert to speech..."
          className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
        />
        <p className="text-xs text-muted-foreground mt-1 text-right">{text.length} / 4096 characters</p>
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Voice</label>
        <div className="grid grid-cols-3 gap-2">
          {VOICES.map(v => (
            <button
              key={v} onClick={() => setVoice(v)}
              className={cn('px-3 py-2 rounded-lg text-sm font-medium border transition-colors capitalize', voice === v ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:bg-accent')}
            >
              {v}
            </button>
          ))}
        </div>
      </div>
      <Button onClick={() => mutation.mutate()} disabled={!text.trim() || mutation.isPending} className="w-full">
        {mutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Generating Audio...</> : 'Generate Speech'}
      </Button>
      {audioUrl && (
        <div className="border border-border rounded-xl p-4 bg-muted/30">
          <p className="text-xs font-semibold text-muted-foreground uppercase mb-3">Generated Audio</p>
          <audio controls src={audioUrl} className="w-full" />
          <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => {
            const a = document.createElement('a'); a.href = audioUrl; a.download = 'speech.mp3'; a.click();
          }}>
            <Download className="h-3.5 w-3.5 mr-1" />Download MP3
          </Button>
        </div>
      )}
    </div>
  );
}

function CareerAdvisorTab() {
  const [interests, setInterests] = useState('');
  const [skills, setSkills] = useState('');
  const [educationLevel, setEducationLevel] = useState('High School Graduate');
  const [targetRole, setTargetRole] = useState('');
  const [result, setResult] = useState<any>(null);

  const mutation = useMutation({
    mutationFn: () => api.post('/ai/career/advise', {
      interests: interests.split(',').map(s => s.trim()).filter(Boolean),
      skills: skills.split(',').map(s => s.trim()).filter(Boolean),
      educationLevel,
      targetRole: targetRole || undefined,
    }).then(r => r.data.data),
    onSuccess: (data) => setResult(data.advice),
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Interests (comma-separated)</label>
          <input value={interests} onChange={e => setInterests(e.target.value)} placeholder="technology, design, writing..." className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Current Skills (comma-separated)</label>
          <input value={skills} onChange={e => setSkills(e.target.value)} placeholder="Python, communication, math..." className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Education Level</label>
          <select value={educationLevel} onChange={e => setEducationLevel(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary">
            {['High School Graduate', 'Some College', "Associate's Degree", "Bachelor's Degree", "Master's Degree", 'PhD', 'Vocational Training'].map(l => <option key={l}>{l}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Target Role (optional)</label>
          <input value={targetRole} onChange={e => setTargetRole(e.target.value)} placeholder="e.g. Software Engineer..." className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
      </div>
      <Button onClick={() => mutation.mutate()} disabled={!interests || !skills || mutation.isPending} className="w-full">
        {mutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Analyzing Career Path...</> : 'Get Career Advice'}
      </Button>

      {result && (
        <div className="space-y-4">
          <div className="border border-border rounded-xl overflow-hidden">
            <div className="bg-primary/5 px-4 py-2">
              <h3 className="text-sm font-semibold text-foreground">Top Career Paths</h3>
            </div>
            <div className="divide-y divide-border">
              {result.careerPaths?.map((p: any, i: number) => (
                <div key={i} className="p-3 flex items-start gap-3">
                  <div className="text-center shrink-0">
                    <div className="text-lg font-bold text-primary">{p.match}%</div>
                    <div className="text-xs text-muted-foreground">match</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground">{p.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{p.description}</p>
                    <div className="flex gap-3 mt-1">
                      <span className="text-xs text-green-600 font-medium">{p.avgSalary}</span>
                      <span className="text-xs text-blue-600 font-medium">{p.growth} growth</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {result.skillGaps?.length > 0 && (
            <div className="border border-border rounded-xl p-3">
              <h3 className="text-sm font-semibold text-foreground mb-2">Skill Gaps to Address</h3>
              <div className="flex flex-wrap gap-1.5">{result.skillGaps.map((s: string, i: number) => <span key={i} className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">{s}</span>)}</div>
            </div>
          )}

          {result.certifications?.length > 0 && (
            <div className="border border-border rounded-xl p-3">
              <h3 className="text-sm font-semibold text-foreground mb-2">Recommended Certifications</h3>
              <div className="space-y-2">
                {result.certifications.map((c: any, i: number) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                    <div><p className="text-sm font-medium text-foreground">{c.name}</p><p className="text-xs text-muted-foreground">{c.provider} · {c.relevance}</p></div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PerformancePredictionTab() {
  const [studentId, setStudentId] = useState('');
  const [result, setResult] = useState<any>(null);

  const mutation = useMutation({
    mutationFn: () => api.get(`/ai/predict/performance/${studentId}`).then(r => r.data.data),
    onSuccess: setResult,
  });

  const levelColors: Record<string, string> = {
    excellent: 'text-green-600 bg-green-50', good: 'text-blue-600 bg-blue-50',
    average: 'text-yellow-600 bg-yellow-50', 'at-risk': 'text-red-600 bg-red-50',
  };

  return (
    <div className="space-y-4">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
        This tool analyzes past assignment scores and submission history to predict future performance. Enter a student ID to analyze.
      </div>
      <div className="flex gap-3">
        <input
          value={studentId} onChange={e => setStudentId(e.target.value)}
          placeholder="Student ID (UUID)..."
          className="flex-1 px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <Button onClick={() => mutation.mutate()} disabled={!studentId || mutation.isPending}>
          {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Analyze'}
        </Button>
      </div>
      {result && (
        <div className="border border-border rounded-xl overflow-hidden">
          <div className="bg-primary/5 px-4 py-3">
            <h3 className="font-semibold text-foreground text-sm">Performance Prediction</h3>
          </div>
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <div className="text-2xl font-bold text-foreground">{Math.round(result.prediction.predictedGrade)}%</div>
                <div className="text-xs text-muted-foreground">Predicted Grade</div>
              </div>
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <div className="text-2xl font-bold text-foreground">{result.prediction.submissionRate}%</div>
                <div className="text-xs text-muted-foreground">Submission Rate</div>
              </div>
              <div className={cn('text-center p-3 rounded-lg', levelColors[result.prediction.performanceLevel] ?? 'bg-muted/30')}>
                <div className="text-sm font-bold capitalize">{result.prediction.performanceLevel}</div>
                <div className="text-xs opacity-75">Performance Level</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Trend:</span>
              <span className={cn('text-sm font-medium capitalize', result.prediction.trend === 'improving' ? 'text-green-600' : result.prediction.trend === 'declining' ? 'text-red-600' : 'text-yellow-600')}>{result.prediction.trend}</span>
            </div>
            {result.prediction.recommendations?.length > 0 && (
              <div>
                <p className="text-sm font-medium text-foreground mb-2">Recommendations</p>
                <ul className="space-y-1">{result.prediction.recommendations.map((r: string, i: number) => <li key={i} className="text-sm text-muted-foreground flex gap-2"><ChevronRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />{r}</li>)}</ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function DropoutRiskTab() {
  const [studentId, setStudentId] = useState('');
  const [result, setResult] = useState<any>(null);

  const mutation = useMutation({
    mutationFn: () => api.get(`/ai/predict/dropout/${studentId}`).then(r => r.data.data),
    onSuccess: setResult,
  });

  const riskColors: Record<string, string> = {
    low: 'text-green-600 bg-green-50 border-green-200',
    medium: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    high: 'text-red-600 bg-red-50 border-red-200',
  };

  return (
    <div className="space-y-4">
      <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
        Early intervention can prevent dropout. This model analyzes engagement, submission rates, and scores to identify at-risk students.
      </div>
      <div className="flex gap-3">
        <input
          value={studentId} onChange={e => setStudentId(e.target.value)}
          placeholder="Student ID (UUID)..."
          className="flex-1 px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <Button onClick={() => mutation.mutate()} disabled={!studentId || mutation.isPending}>
          {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Analyze Risk'}
        </Button>
      </div>
      {result && (
        <div className={cn('border rounded-xl overflow-hidden', riskColors[result.riskLevel])}>
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <h3 className="font-semibold text-sm">Dropout Risk Assessment</h3>
            <span className={cn('text-xs font-bold px-2 py-1 rounded-full border uppercase', riskColors[result.riskLevel])}>{result.riskLevel} Risk</span>
          </div>
          <div className="p-4 bg-background space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-muted rounded-full h-3">
                <div className="h-3 rounded-full transition-all" style={{ width: `${result.riskScore}%`, backgroundColor: result.riskLevel === 'high' ? '#ef4444' : result.riskLevel === 'medium' ? '#f59e0b' : '#22c55e' }} />
              </div>
              <span className="text-lg font-bold text-foreground w-12 text-right">{result.riskScore}%</span>
            </div>
            {result.factors?.length > 0 && (
              <div>
                <p className="text-sm font-medium text-foreground mb-1">Risk Factors</p>
                <ul className="space-y-1">{result.factors.map((f: string, i: number) => <li key={i} className="text-sm text-muted-foreground flex gap-2"><AlertTriangle className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />{f}</li>)}</ul>
              </div>
            )}
            {result.interventions?.length > 0 && (
              <div>
                <p className="text-sm font-medium text-foreground mb-1">Recommended Interventions</p>
                <ul className="space-y-1">{result.interventions.map((v: string, i: number) => <li key={i} className="text-sm text-muted-foreground flex gap-2"><CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />{v}</li>)}</ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const TAB_COMPONENTS: Record<Tab, React.ComponentType> = {
  curriculum: CurriculumTab,
  research: ResearchTab,
  stt: SpeechToTextTab,
  tts: TextToSpeechTab,
  career: CareerAdvisorTab,
  performance: PerformancePredictionTab,
  dropout: DropoutRiskTab,
};

export default function AIToolsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('curriculum');
  const ActiveComponent = TAB_COMPONENTS[activeTab];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">AI Tools</h1>
        <p className="text-muted-foreground text-sm mt-1">Powered by Claude and GPT-4o — curriculum generation, research, speech, career guidance, and predictive analytics.</p>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all',
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium leading-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="mb-4">
          {TABS.filter(t => t.id === activeTab).map(tab => (
            <div key={tab.id}>
              <h2 className="text-base font-semibold text-foreground">{tab.label}</h2>
              <p className="text-xs text-muted-foreground">{tab.description}</p>
            </div>
          ))}
        </div>
        <ActiveComponent />
      </div>
    </div>
  );
}
