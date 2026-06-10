'use client';

import { useMutation } from '@tanstack/react-query';
import {
  BookOpen, Search, Mic, Volume2, Briefcase, TrendingUp, AlertTriangle,
  ChevronRight, Loader2, CheckCircle, Download,
  Brain, FileQuestion, GraduationCap, Layers, Network, Languages, SearchCheck, ShieldCheck,
} from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

type Tab =
  | 'curriculum'
  | 'research'
  | 'stt'
  | 'tts'
  | 'career'
  | 'performance'
  | 'dropout'
  | 'homework'
  | 'exam'
  | 'lesson'
  | 'flashcards'
  | 'mindmap'
  | 'translator'
  | 'plagiarism'
  | 'moderation';

const TABS: { id: Tab; label: string; icon: React.ComponentType<any>; description: string; roles?: string[] }[] = [
  { id: 'curriculum', label: 'Curriculum', icon: BookOpen, description: 'Generate full multi-week curricula' },
  { id: 'research', label: 'Research', icon: Search, description: 'AI-powered research assistant' },
  { id: 'stt', label: 'Speech-to-Text', icon: Mic, description: 'Transcribe audio recordings' },
  { id: 'tts', label: 'Text-to-Speech', icon: Volume2, description: 'Convert text to natural speech' },
  { id: 'career', label: 'Career Advisor', icon: Briefcase, description: 'Personalized career guidance' },
  { id: 'performance', label: 'Performance', icon: TrendingUp, description: 'Predict student performance', roles: ['SUPER_ADMIN', 'ADMIN', 'SCHOOL_ADMIN', 'TEACHER'] },
  { id: 'dropout', label: 'Dropout Risk', icon: AlertTriangle, description: 'Identify at-risk students', roles: ['SUPER_ADMIN', 'ADMIN', 'SCHOOL_ADMIN', 'TEACHER'] },
  { id: 'homework', label: 'Homework', icon: Brain, description: 'Step-by-step homework solutions' },
  { id: 'exam', label: 'Exam Generator', icon: FileQuestion, description: 'Generate exams with multiple question types' },
  { id: 'lesson', label: 'Lesson Planner', icon: GraduationCap, description: 'Create structured lesson plans' },
  { id: 'flashcards', label: 'Flashcards', icon: Layers, description: 'Generate interactive study flashcards' },
  { id: 'mindmap', label: 'Mind Map', icon: Network, description: 'Visualize topics as mind maps' },
  { id: 'translator', label: 'Translator', icon: Languages, description: 'Translate text between languages' },
  { id: 'plagiarism', label: 'Plagiarism', icon: SearchCheck, description: 'Check content for plagiarism' },
  { id: 'moderation', label: 'Moderation', icon: ShieldCheck, description: 'Moderate content for safety' },
];

const SUBJECTS = ['Mathematics', 'Science', 'English', 'History', 'Geography', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'Art', 'Music', 'Physical Education'];
const GRADE_LEVELS = ['K-5', '6-8', '9-12', 'University'];

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
      if (!conversationId) {setConversationId(data.conversationId);}
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

// ─── New Tabs ────────────────────────────────────────────────────────────────

function HomeworkTab() {
  const [problem, setProblem] = useState('');
  const [subject, setSubject] = useState('Mathematics');
  const [result, setResult] = useState<{ steps: string[]; answer: string; explanation: string } | null>(null);

  const mutation = useMutation({
    mutationFn: () => api.post('/ai/homework/solve', { problem, subject }).then(r => r.data.data),
    onSuccess: (data) => setResult(data),
  });

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Subject</label>
        <select
          value={subject} onChange={e => setSubject(e.target.value)}
          className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {SUBJECTS.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Problem</label>
        <textarea
          value={problem} onChange={e => setProblem(e.target.value)} rows={4}
          placeholder="Describe the homework problem in detail..."
          className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
        />
      </div>
      <Button onClick={() => mutation.mutate()} disabled={!problem.trim() || mutation.isPending} className="w-full">
        {mutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Solving...</> : 'Solve Problem'}
      </Button>

      {result && (
        <div className="space-y-4">
          {result.steps && result.steps.length > 0 && (
            <div className="border border-border rounded-xl overflow-hidden">
              <div className="bg-primary/5 px-4 py-2">
                <h3 className="text-sm font-semibold text-foreground">Step-by-Step Solution</h3>
              </div>
              <ol className="divide-y divide-border">
                {result.steps.map((step, i) => (
                  <li key={i} className="p-3 flex gap-3 items-start">
                    <span className="text-xs font-bold bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                    <p className="text-sm text-foreground">{step}</p>
                  </li>
                ))}
              </ol>
            </div>
          )}
          {result.answer && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-green-700 uppercase mb-1">Final Answer</p>
              <p className="text-sm font-medium text-green-900">{result.answer}</p>
            </div>
          )}
          {result.explanation && (
            <div className="border border-border rounded-xl p-4 bg-muted/30">
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Explanation</p>
              <p className="text-sm text-foreground leading-relaxed">{result.explanation}</p>
            </div>
          )}
          {!result.steps && !result.answer && (
            <div className="border border-border rounded-xl p-4 bg-muted/30">
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{(result as any).solution ?? JSON.stringify(result)}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ExamGeneratorTab() {
  const [topic, setTopic] = useState('');
  const [gradeLevel, setGradeLevel] = useState('9-12');
  const [difficulty, setDifficulty] = useState('Medium');
  const [numQuestions, setNumQuestions] = useState(10);
  const [questionTypes, setQuestionTypes] = useState<string[]>(['multiple_choice', 'short_answer']);
  const [result, setResult] = useState<any>(null);
  const [savedExamId, setSavedExamId] = useState<string | null>(null);

  const saveMutation = useMutation({
    mutationFn: () => api.post('/exams', {
      title: result.title,
      subject: topic,
      difficulty: difficulty.toLowerCase(),
      questions: result.questions,
    }).then(r => r.data),
    onSuccess: (data) => setSavedExamId(data.id),
  });

  const QUESTION_TYPES = [
    { value: 'multiple_choice', label: 'Multiple Choice' },
    { value: 'true_false', label: 'True / False' },
    { value: 'short_answer', label: 'Short Answer' },
    { value: 'essay', label: 'Essay' },
  ];

  const toggleType = (value: string) =>
    setQuestionTypes(prev => prev.includes(value) ? prev.filter(t => t !== value) : [...prev, value]);

  const copyExam = () => {
    if (!result) {return;}
    const lines: string[] = [`${result.title}\n`];
    result.questions?.forEach((q: any, i: number) => {
      lines.push(`${i + 1}. [${q.type}] ${q.question}`);
      if (q.options) {q.options.forEach((opt: string, oi: number) => lines.push(`   ${String.fromCharCode(65 + oi)}. ${opt}`));}
      lines.push('');
    });
    navigator.clipboard.writeText(lines.join('\n'));
  };

  const mutation = useMutation({
    mutationFn: () => api.post('/ai/exam/generate', { topic, gradeLevel, numQuestions, difficulty, questionTypes }).then(r => r.data.data),
    onSuccess: (data) => setResult(data.exam ?? data),
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Topic</label>
          <input
            value={topic} onChange={e => setTopic(e.target.value)}
            placeholder="e.g. Photosynthesis, World War II..."
            className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Grade Level</label>
          <select value={gradeLevel} onChange={e => setGradeLevel(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary">
            {GRADE_LEVELS.map(g => <option key={g}>{g}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Difficulty</label>
          <div className="grid grid-cols-3 gap-2">
            {['Easy', 'Medium', 'Hard'].map(d => (
              <button key={d} onClick={() => setDifficulty(d)}
                className={cn('px-3 py-2 rounded-lg text-sm font-medium border transition-colors', difficulty === d ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:bg-accent')}>
                {d}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Number of Questions ({numQuestions})</label>
          <input type="range" min={5} max={30} value={numQuestions} onChange={e => setNumQuestions(+e.target.value)} className="w-full" />
          <div className="flex justify-between text-xs text-muted-foreground mt-1"><span>5</span><span>30</span></div>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Question Types</label>
        <div className="flex flex-wrap gap-2">
          {QUESTION_TYPES.map(qt => (
            <button key={qt.value} onClick={() => toggleType(qt.value)}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors', questionTypes.includes(qt.value) ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:bg-accent')}>
              {qt.label}
            </button>
          ))}
        </div>
      </div>
      <Button onClick={() => mutation.mutate()} disabled={!topic.trim() || questionTypes.length === 0 || mutation.isPending} className="w-full">
        {mutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Generating Exam...</> : 'Generate Exam'}
      </Button>

      {result && (
        <div className="border border-border rounded-xl overflow-hidden">
          <div className="bg-primary/5 px-4 py-3 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground">{result.title}</h3>
              <p className="text-xs text-muted-foreground">{result.questions?.length} questions</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={copyExam}>Copy</Button>
              {savedExamId ? (
                <Button variant="outline" size="sm" className="text-green-600 border-green-400" disabled>Saved!</Button>
              ) : (
                <Button size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Save to Library'}
                </Button>
              )}
            </div>
          </div>
          <ol className="divide-y divide-border max-h-[480px] overflow-y-auto">
            {result.questions?.map((q: any, i: number) => (
              <li key={i} className="p-4">
                <div className="flex items-start gap-2 mb-2">
                  <span className="text-xs font-bold bg-primary/10 text-primary rounded px-1.5 py-0.5 shrink-0">{i + 1}</span>
                  <p className="text-sm font-medium text-foreground">{q.question}</p>
                  <span className="ml-auto text-xs text-muted-foreground shrink-0">{q.points}pt</span>
                </div>
                {q.options && (
                  <div className="ml-6 space-y-1">
                    {q.options.map((opt: string, oi: number) => (
                      <div key={oi} className="flex gap-2 text-sm text-foreground">
                        <span className="font-medium text-muted-foreground">{String.fromCharCode(65 + oi)}.</span>
                        <span>{opt}</span>
                      </div>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

function LessonPlannerTab() {
  const [topic, setTopic] = useState('');
  const [gradeLevel, setGradeLevel] = useState('9-12');
  const [duration, setDuration] = useState(60);
  const [objectives, setObjectives] = useState('');
  const [result, setResult] = useState<any>(null);

  const mutation = useMutation({
    mutationFn: () => api.post('/ai/lesson/generate', {
      topic, gradeLevel, duration,
      objectives: objectives.split('\n').map(o => o.trim()).filter(Boolean),
    }).then(r => r.data.data),
    onSuccess: (data) => setResult(data.lesson ?? data),
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Topic</label>
          <input
            value={topic} onChange={e => setTopic(e.target.value)}
            placeholder="e.g. Introduction to Fractions..."
            className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Grade Level</label>
          <select value={gradeLevel} onChange={e => setGradeLevel(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary">
            {GRADE_LEVELS.map(g => <option key={g}>{g}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Duration (minutes)</label>
          <select value={duration} onChange={e => setDuration(+e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary">
            {[30, 45, 60, 90].map(d => <option key={d} value={d}>{d} min</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Learning Objectives (one per line)</label>
          <textarea
            value={objectives} onChange={e => setObjectives(e.target.value)} rows={3}
            placeholder="Students will be able to..."
            className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
        </div>
      </div>
      <Button onClick={() => mutation.mutate()} disabled={!topic.trim() || mutation.isPending} className="w-full">
        {mutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Creating Lesson Plan...</> : 'Generate Lesson Plan'}
      </Button>

      {result && (
        <div className="border border-border rounded-xl overflow-hidden">
          <div className="bg-primary/5 px-4 py-3">
            <h3 className="font-semibold text-foreground">{result.title}</h3>
          </div>
          <div className="p-4 space-y-4 max-h-[480px] overflow-y-auto">
            {result.objectives?.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Objectives</h4>
                <ul className="space-y-1">{result.objectives.map((o: string, i: number) => <li key={i} className="text-sm text-foreground flex gap-2"><CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />{o}</li>)}</ul>
              </div>
            )}
            {result.materials?.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Materials</h4>
                <div className="flex flex-wrap gap-1.5">{result.materials.map((m: string, i: number) => <span key={i} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{m}</span>)}</div>
              </div>
            )}
            {result.introduction && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">Introduction</h4>
                <p className="text-sm text-foreground leading-relaxed">{result.introduction}</p>
              </div>
            )}
            {result.mainContent?.sections?.map((s: any, i: number) => (
              <div key={i} className="border border-border rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-semibold text-foreground">{s.title}</h4>
                  <span className="text-xs text-muted-foreground">{s.duration} min</span>
                </div>
                <p className="text-xs text-foreground mb-2">{s.content}</p>
                {s.activity && <p className="text-xs text-primary font-medium">Activity: {s.activity}</p>}
              </div>
            ))}
            {result.assessment && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">Assessment</h4>
                <p className="text-sm text-foreground">{result.assessment}</p>
              </div>
            )}
            {result.homework && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">Homework</h4>
                <p className="text-sm text-foreground">{result.homework}</p>
              </div>
            )}
            {result.teacherNotes && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <h4 className="text-xs font-semibold text-amber-700 uppercase mb-1">Teacher Notes</h4>
                <p className="text-sm text-amber-900">{result.teacherNotes}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function FlashcardsTab() {
  const [topic, setTopic] = useState('');
  const [numCards, setNumCards] = useState(10);
  const [cards, setCards] = useState<Array<{ front: string; back: string }>>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flippedIndex, setFlippedIndex] = useState<number | null>(null);
  const [savedDeckId, setSavedDeckId] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => api.post('/ai/flashcards/generate', { topic, numCards }).then(r => r.data.data),
    onSuccess: (data) => {
      const cardList = data.flashcards?.cards ?? data.cards ?? [];
      setCards(cardList);
      setCurrentIndex(0);
      setFlippedIndex(null);
      setSavedDeckId(null);
    },
  });

  const saveMutation = useMutation({
    mutationFn: () => api.post('/flashcards/decks', {
      title: `Flashcards: ${topic}`,
      topic,
      cards,
    }).then(r => r.data),
    onSuccess: (data) => setSavedDeckId(data.id),
  });

  const card = cards[currentIndex];
  const isFlipped = flippedIndex === currentIndex;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Topic</label>
          <input
            value={topic} onChange={e => setTopic(e.target.value)}
            placeholder="e.g. Periodic Table, French Revolution..."
            className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Number of Cards ({numCards})</label>
          <input type="range" min={5} max={20} value={numCards} onChange={e => setNumCards(+e.target.value)} className="w-full mt-2" />
          <div className="flex justify-between text-xs text-muted-foreground mt-1"><span>5</span><span>20</span></div>
        </div>
      </div>
      <Button onClick={() => mutation.mutate()} disabled={!topic.trim() || mutation.isPending} className="w-full">
        {mutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Generating Flashcards...</> : 'Generate Flashcards'}
      </Button>

      {cards.length > 0 && card && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Card {currentIndex + 1} / {cards.length}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs">{isFlipped ? 'Answer' : 'Question'} — click card to flip</span>
              {savedDeckId ? (
                <span className="text-xs text-green-600 font-medium">Saved to library!</span>
              ) : (
                <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}
                  className="text-xs text-primary font-medium hover:underline disabled:opacity-50">
                  {saveMutation.isPending ? 'Saving...' : 'Save Deck'}
                </button>
              )}
            </div>
          </div>
          <button
            onClick={() => setFlippedIndex(isFlipped ? null : currentIndex)}
            className="w-full min-h-[160px] border-2 border-primary/30 rounded-2xl p-6 text-center transition-all hover:border-primary hover:shadow-md bg-card cursor-pointer"
          >
            {isFlipped ? (
              <div>
                <p className="text-xs font-semibold text-primary uppercase mb-3">Answer</p>
                <p className="text-base text-foreground leading-relaxed">{card.back}</p>
              </div>
            ) : (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-3">Question</p>
                <p className="text-base font-medium text-foreground leading-relaxed">{card.front}</p>
              </div>
            )}
          </button>
          <div className="flex items-center justify-between gap-3">
            <Button variant="outline" onClick={() => { setCurrentIndex(i => Math.max(0, i - 1)); setFlippedIndex(null); }} disabled={currentIndex === 0}>
              Previous
            </Button>
            <div className="flex gap-1">
              {cards.map((_, i) => (
                <button key={i} onClick={() => { setCurrentIndex(i); setFlippedIndex(null); }}
                  className={cn('w-2 h-2 rounded-full transition-colors', i === currentIndex ? 'bg-primary' : 'bg-border hover:bg-muted-foreground')}
                />
              ))}
            </div>
            <Button variant="outline" onClick={() => { setCurrentIndex(i => Math.min(cards.length - 1, i + 1)); setFlippedIndex(null); }} disabled={currentIndex === cards.length - 1}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function MindMapTab() {
  const [topic, setTopic] = useState('');
  const [result, setResult] = useState<{ topic: string; central: string; branches: Array<{ label: string; children: string[] }> } | null>(null);
  const [expandedBranches, setExpandedBranches] = useState<Set<number>>(new Set());

  const mutation = useMutation({
    mutationFn: () => api.post('/ai/mindmap/generate', { topic }).then(r => r.data.data),
    onSuccess: (data) => {
      const mm = data.mindMap ?? data;
      const branches = (mm.branches ?? []).map((b: any) => ({
        label: b.label,
        children: (b.children ?? []).map((c: any) => (typeof c === 'string' ? c : c.label)),
      }));
      setResult({ topic: mm.central ?? topic, central: mm.central ?? topic, branches });
      setExpandedBranches(new Set(branches.map((_: any, i: number) => i)));
    },
  });

  const toggleBranch = (i: number) => setExpandedBranches(prev => {
    const next = new Set(prev);
    next.has(i) ? next.delete(i) : next.add(i);
    return next;
  });

  const BRANCH_COLORS = ['bg-blue-100 text-blue-700 border-blue-200', 'bg-green-100 text-green-700 border-green-200', 'bg-purple-100 text-purple-700 border-purple-200', 'bg-orange-100 text-orange-700 border-orange-200', 'bg-pink-100 text-pink-700 border-pink-200', 'bg-teal-100 text-teal-700 border-teal-200'];

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Topic</label>
        <input
          value={topic} onChange={e => setTopic(e.target.value)}
          placeholder="e.g. Climate Change, Machine Learning..."
          className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      <Button onClick={() => mutation.mutate()} disabled={!topic.trim() || mutation.isPending} className="w-full">
        {mutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Generating Mind Map...</> : 'Generate Mind Map'}
      </Button>

      {result && (
        <div className="border border-border rounded-xl overflow-hidden">
          <div className="bg-primary px-4 py-3 text-center">
            <span className="text-base font-bold text-primary-foreground">{result.central}</span>
          </div>
          <div className="p-4 space-y-3 max-h-[480px] overflow-y-auto">
            {result.branches.map((branch, i) => (
              <div key={i} className={cn('border rounded-lg overflow-hidden', BRANCH_COLORS[i % BRANCH_COLORS.length])}>
                <button
                  onClick={() => toggleBranch(i)}
                  className="w-full flex items-center justify-between px-4 py-2.5 font-medium text-sm"
                >
                  <span>{branch.label}</span>
                  <ChevronRight className={cn('h-4 w-4 transition-transform', expandedBranches.has(i) ? 'rotate-90' : '')} />
                </button>
                {expandedBranches.has(i) && branch.children.length > 0 && (
                  <div className="px-4 pb-3 pt-1 bg-white/60 space-y-1">
                    {branch.children.map((child, j) => (
                      <div key={j} className="flex items-start gap-2 text-sm text-foreground">
                        <span className="text-muted-foreground mt-1">•</span>
                        <span>{child}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TranslatorTab() {
  const [text, setText] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('Spanish');
  const [sourceLanguage, setSourceLanguage] = useState('Auto-detect');
  const [result, setResult] = useState<{ translatedText: string; detectedLanguage?: string } | null>(null);

  const LANGUAGES = ['Spanish', 'French', 'German', 'Arabic', 'Chinese', 'Japanese', 'Portuguese', 'Russian', 'Italian', 'Hindi'];

  const mutation = useMutation({
    mutationFn: () => api.post('/ai/translate', {
      text,
      targetLanguage,
      sourceLanguage: sourceLanguage === 'Auto-detect' ? 'auto' : sourceLanguage,
    }).then(r => r.data.data),
    onSuccess: (data) => setResult({ translatedText: data.translation ?? data.translatedText, detectedLanguage: data.detectedLanguage }),
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Source Language</label>
          <select value={sourceLanguage} onChange={e => setSourceLanguage(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary">
            <option>Auto-detect</option>
            {LANGUAGES.map(l => <option key={l}>{l}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Target Language</label>
          <select value={targetLanguage} onChange={e => setTargetLanguage(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary">
            {LANGUAGES.map(l => <option key={l}>{l}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Source Text</label>
        <textarea
          value={text} onChange={e => setText(e.target.value)} rows={5}
          placeholder="Enter text to translate..."
          className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
        />
      </div>
      <Button onClick={() => mutation.mutate()} disabled={!text.trim() || mutation.isPending} className="w-full">
        {mutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Translating...</> : 'Translate'}
      </Button>

      {result && (
        <div className="grid grid-cols-2 gap-4">
          <div className="border border-border rounded-xl p-4 bg-muted/30">
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
              Original {result.detectedLanguage ? `(Detected: ${result.detectedLanguage})` : ''}
            </p>
            <p className="text-sm text-foreground leading-relaxed">{text}</p>
          </div>
          <div className="border border-primary/30 rounded-xl p-4 bg-primary/5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-primary uppercase">{targetLanguage}</p>
              <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(result.translatedText)}>Copy</Button>
            </div>
            <p className="text-sm text-foreground leading-relaxed">{result.translatedText}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function PlagiarismTab() {
  const [content, setContent] = useState('');
  const [result, setResult] = useState<any>(null);

  const mutation = useMutation({
    mutationFn: () => api.post('/ai/plagiarism/check', { content }).then(r => r.data.data),
    onSuccess: (data) => setResult(data.result ?? data),
  });

  const score: number = result?.overallScore ?? result?.score ?? 0;
  const scoreColor = score < 20 ? 'text-green-600' : score < 50 ? 'text-yellow-600' : 'text-red-600';
  const scoreBg = score < 20 ? 'bg-green-500' : score < 50 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Content to Check</label>
        <textarea
          value={content} onChange={e => setContent(e.target.value)} rows={8}
          placeholder="Paste the text you want to check for plagiarism..."
          className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
        />
        <p className="text-xs text-muted-foreground mt-1 text-right">{content.length} characters</p>
      </div>
      <Button onClick={() => mutation.mutate()} disabled={!content.trim() || mutation.isPending} className="w-full">
        {mutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Checking...</> : 'Check for Plagiarism'}
      </Button>

      {result && (
        <div className="space-y-4">
          <div className="border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground">Plagiarism Score</h3>
              <span className={cn('text-2xl font-bold', scoreColor)}>{Math.round(score)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-3 mb-3">
              <div className={cn('h-3 rounded-full transition-all', scoreBg)} style={{ width: `${Math.min(100, score)}%` }} />
            </div>
            {result.verdict && (
              <span className={cn('text-xs font-semibold px-2 py-1 rounded-full', score < 20 ? 'bg-green-100 text-green-700' : score < 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700')}>
                {result.verdict}
              </span>
            )}
            {result.summary && <p className="text-sm text-muted-foreground mt-3">{result.summary}</p>}
            {result.aiGenerated !== undefined && (
              <p className="text-sm text-muted-foreground mt-1">AI-generated content: <span className="font-medium text-foreground">{result.aiGenerated ? 'Likely' : 'Unlikely'}</span></p>
            )}
          </div>

          {result.flags?.length > 0 && (
            <div className="border border-border rounded-xl p-4">
              <h3 className="text-sm font-semibold text-foreground mb-2">Flags</h3>
              <ul className="space-y-1">
                {result.flags.map((f: string, i: number) => (
                  <li key={i} className="flex gap-2 text-sm text-muted-foreground"><AlertTriangle className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />{f}</li>
                ))}
              </ul>
            </div>
          )}

          {result.matches?.length > 0 && (
            <div className="border border-border rounded-xl overflow-hidden">
              <div className="bg-primary/5 px-4 py-2">
                <h3 className="text-sm font-semibold text-foreground">Matches ({result.matches.length})</h3>
              </div>
              <div className="divide-y divide-border">
                {result.matches.map((m: any, i: number) => (
                  <div key={i} className="p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-foreground">{m.source ?? `Match ${i + 1}`}</span>
                      <span className="text-xs font-bold text-red-600">{Math.round(m.similarity * 100)}% similar</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div className="h-1.5 rounded-full bg-red-400" style={{ width: `${m.similarity * 100}%` }} />
                    </div>
                    <p className="text-xs text-muted-foreground italic">&ldquo;{m.text}&rdquo;</p>
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

function ContentModerationTab() {
  const [content, setContent] = useState('');
  const [result, setResult] = useState<{
    safe?: boolean;
    flagged?: boolean;
    categories?: Record<string, boolean>;
    scores?: Record<string, number>;
    flaggedCategories?: string[];
  } | null>(null);

  const mutation = useMutation({
    mutationFn: () => api.post('/ai/content/moderate', { content }).then(r => r.data.data),
    onSuccess: (data) => setResult(data),
  });

  const isSafe = result ? (result.safe ?? !result.flagged) : null;

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Content to Moderate</label>
        <textarea
          value={content} onChange={e => setContent(e.target.value)} rows={6}
          placeholder="Enter content to check for inappropriate material..."
          className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
        />
      </div>
      <Button onClick={() => mutation.mutate()} disabled={!content.trim() || mutation.isPending} className="w-full">
        {mutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Moderating...</> : 'Moderate Content'}
      </Button>

      {result && (
        <div className="space-y-4">
          <div className={cn('border rounded-xl p-4 flex items-center gap-3', isSafe ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200')}>
            {isSafe
              ? <CheckCircle className="h-6 w-6 text-green-600 shrink-0" />
              : <AlertTriangle className="h-6 w-6 text-red-600 shrink-0" />
            }
            <div>
              <p className={cn('font-semibold text-sm', isSafe ? 'text-green-700' : 'text-red-700')}>
                {isSafe ? 'Content is Safe' : 'Content Flagged'}
              </p>
              <p className={cn('text-xs', isSafe ? 'text-green-600' : 'text-red-600')}>
                {isSafe ? 'No policy violations detected.' : 'Content may violate safety policies.'}
              </p>
            </div>
          </div>

          {result.categories && Object.keys(result.categories).length > 0 && (
            <div className="border border-border rounded-xl overflow-hidden">
              <div className="bg-primary/5 px-4 py-2">
                <h3 className="text-sm font-semibold text-foreground">Category Scores</h3>
              </div>
              <div className="divide-y divide-border">
                {Object.entries(result.categories).map(([cat, flagged]) => {
                  const score = (result.scores?.[cat] ?? 0);
                  const pct = Math.round(score * 100);
                  return (
                    <div key={cat} className="p-3 flex items-center gap-3">
                      <div className="w-32 shrink-0">
                        <p className="text-xs font-medium text-foreground capitalize">{cat.replace(/_/g, ' ')}</p>
                      </div>
                      <div className="flex-1 bg-muted rounded-full h-2">
                        <div
                          className={cn('h-2 rounded-full transition-all', (flagged) ? 'bg-red-500' : 'bg-green-400')}
                          style={{ width: `${Math.max(2, pct)}%` }}
                        />
                      </div>
                      <div className="w-16 text-right">
                        <span className="text-xs text-muted-foreground">{pct}%</span>
                      </div>
                      <span className={cn('text-xs font-semibold px-1.5 py-0.5 rounded', (flagged) ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700')}>
                        {(flagged) ? 'Flagged' : 'OK'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {result.flaggedCategories && result.flaggedCategories.length > 0 && (
            <div className="border border-red-200 rounded-xl p-4 bg-red-50">
              <h3 className="text-sm font-semibold text-red-700 mb-2">Flagged Issues</h3>
              <ul className="space-y-1">
                {result.flaggedCategories.map((f: string, i: number) => (
                  <li key={i} className="flex gap-2 text-sm text-red-700">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span className="capitalize">{f.replace(/_/g, ' ')}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Tab Registry ────────────────────────────────────────────────────────────

const TAB_COMPONENTS: Record<Tab, React.ComponentType> = {
  curriculum: CurriculumTab,
  research: ResearchTab,
  stt: SpeechToTextTab,
  tts: TextToSpeechTab,
  career: CareerAdvisorTab,
  performance: PerformancePredictionTab,
  dropout: DropoutRiskTab,
  homework: HomeworkTab,
  exam: ExamGeneratorTab,
  lesson: LessonPlannerTab,
  flashcards: FlashcardsTab,
  mindmap: MindMapTab,
  translator: TranslatorTab,
  plagiarism: PlagiarismTab,
  moderation: ContentModerationTab,
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

      <div className="grid grid-cols-5 gap-2 sm:grid-cols-8 lg:grid-cols-15">
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
