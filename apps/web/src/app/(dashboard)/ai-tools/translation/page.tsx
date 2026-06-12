'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeftRight, Languages, Loader2, Copy, BookOpen, CheckCircle } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

const SUPPORTED_LANGUAGES = [
  'English',
  'Spanish',
  'French',
  'German',
  'Arabic',
  'Chinese',
  'Japanese',
  'Portuguese',
  'Hindi',
  'Russian',
  'Italian',
  'Korean',
  'Dutch',
  'Turkish',
  'Polish',
];

interface TranslationResult {
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  confidence: number;
}

interface CourseTranslationResult {
  title: string;
  description: string;
}

export default function TranslationPage() {
  // ── Text translation state ──────────────────────────────────────────────────
  const [sourceText, setSourceText] = useState('');
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('Spanish');
  const [translationResult, setTranslationResult] = useState<TranslationResult | null>(null);
  const [copied, setCopied] = useState(false);

  // ── Course translation state ────────────────────────────────────────────────
  const [courseId, setCourseId] = useState('');
  const [courseLang, setCourseLang] = useState('Spanish');
  const [courseResult, setCourseResult] = useState<CourseTranslationResult | null>(null);

  // ── Supported languages (optional server-driven list) ──────────────────────
  const { data: langData } = useQuery<{ languages: string[] }>({
    queryKey: ['supported-languages'],
    queryFn: () => api.get('/ai/language/supported-languages').then(r => r.data),
    staleTime: Infinity,
  });

  const languages = langData?.languages ?? SUPPORTED_LANGUAGES;

  // ── Translate text mutation ─────────────────────────────────────────────────
  const translateMutation = useMutation({
    mutationFn: () =>
      api
        .post('/ai/language/translate', {
          text: sourceText,
          targetLanguage: targetLang,
          sourceLanguage: sourceLang === 'auto' ? undefined : sourceLang,
        })
        .then(r => r.data as TranslationResult),
    onSuccess: data => {
      setTranslationResult(data);
      setCopied(false);
    },
  });

  // ── Translate course mutation ───────────────────────────────────────────────
  const courseMutation = useMutation({
    mutationFn: () =>
      api
        .post(`/ai/language/translate-course/${courseId}`, {
          targetLanguage: courseLang,
        })
        .then(r => r.data as CourseTranslationResult),
    onSuccess: data => setCourseResult(data),
  });

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const swapLanguages = () => {
    if (sourceLang === 'auto') {return;}
    const tmp = sourceLang;
    setSourceLang(targetLang);
    setTargetLang(tmp);
    setTranslationResult(null);
  };

  const copyTranslation = () => {
    if (!translationResult) {return;}
    void navigator.clipboard.writeText(translationResult.translatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Page header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Languages className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">AI Translator</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Translate text between 15 languages using Claude AI, or translate an entire course title
          and description in one click.
        </p>
      </div>

      {/* ── Main translation panel ──────────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
        <h2 className="font-semibold text-foreground">Text Translation</h2>

        {/* Language selectors */}
        <div className="flex items-center gap-3">
          {/* Source language */}
          <div className="flex-1">
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Source Language
            </label>
            <select
              value={sourceLang}
              onChange={e => {
                setSourceLang(e.target.value);
                setTranslationResult(null);
              }}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="auto">Auto-detect</option>
              {languages.map(l => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          {/* Swap button */}
          <button
            onClick={swapLanguages}
            disabled={sourceLang === 'auto'}
            title={sourceLang === 'auto' ? 'Cannot swap with auto-detect' : 'Swap languages'}
            className={cn(
              'mt-5 p-2 rounded-lg border border-border transition-colors',
              sourceLang === 'auto'
                ? 'opacity-40 cursor-not-allowed'
                : 'hover:bg-accent hover:text-accent-foreground',
            )}
          >
            <ArrowLeftRight className="h-4 w-4" />
          </button>

          {/* Target language */}
          <div className="flex-1">
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Target Language
            </label>
            <select
              value={targetLang}
              onChange={e => {
                setTargetLang(e.target.value);
                setTranslationResult(null);
              }}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {languages.map(l => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Two-panel layout: source + translation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Source panel */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase">
                {sourceLang === 'auto' ? 'Source Text' : sourceLang}
              </span>
              <span className="text-xs text-muted-foreground">{sourceText.length} chars</span>
            </div>
            <textarea
              value={sourceText}
              onChange={e => {
                setSourceText(e.target.value);
                setTranslationResult(null);
              }}
              rows={8}
              placeholder="Enter text to translate..."
              className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          {/* Translation panel */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-primary uppercase">{targetLang}</span>
              {translationResult && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {Math.round(translationResult.confidence * 100)}% confidence
                  </span>
                  <button
                    onClick={copyTranslation}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {copied ? (
                      <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              )}
            </div>
            <div className="relative">
              <div
                className={cn(
                  'w-full min-h-[176px] px-3 py-2 border rounded-xl text-sm bg-primary/5 border-primary/20',
                  !translationResult && 'text-muted-foreground',
                )}
              >
                {translateMutation.isPending ? (
                  <div className="flex items-center justify-center h-32 gap-2 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Translating…</span>
                  </div>
                ) : translationResult ? (
                  <p className="leading-relaxed whitespace-pre-wrap">
                    {translationResult.translatedText}
                  </p>
                ) : (
                  <p className="italic">Translation will appear here…</p>
                )}
              </div>
            </div>
            {translationResult?.sourceLanguage && sourceLang === 'auto' && (
              <p className="text-xs text-muted-foreground">
                Detected language:{' '}
                <span className="font-medium text-foreground">
                  {translationResult.sourceLanguage}
                </span>
              </p>
            )}
          </div>
        </div>

        {translateMutation.isError && (
          <p className="text-sm text-destructive">Translation failed. Please try again.</p>
        )}

        <Button
          onClick={() => translateMutation.mutate()}
          disabled={!sourceText.trim() || translateMutation.isPending}
          className="w-full"
        >
          {translateMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Translating…
            </>
          ) : (
            'Translate'
          )}
        </Button>
      </div>

      {/* ── Course translation quick action ────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-foreground">Translate Course Content</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Enter a Course ID to translate its title and description into any supported language.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Course ID
            </label>
            <input
              value={courseId}
              onChange={e => {
                setCourseId(e.target.value);
                setCourseResult(null);
              }}
              placeholder="e.g. clxyz1234abcdef"
              className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Target Language
            </label>
            <select
              value={courseLang}
              onChange={e => {
                setCourseLang(e.target.value);
                setCourseResult(null);
              }}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {languages.map(l => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Button
          onClick={() => courseMutation.mutate()}
          disabled={!courseId.trim() || courseMutation.isPending}
          variant="outline"
          className="w-full"
        >
          {courseMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Translating Course…
            </>
          ) : (
            'Translate Course'
          )}
        </Button>

        {courseMutation.isError && (
          <p className="text-sm text-destructive">
            Course translation failed. Check the Course ID and try again.
          </p>
        )}

        {courseResult && (
          <div className="border border-primary/20 rounded-xl overflow-hidden">
            <div className="bg-primary/5 px-4 py-2">
              <p className="text-xs font-semibold text-primary uppercase">
                Translated to {courseLang}
              </p>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-0.5">Title</p>
                <p className="text-sm font-semibold text-foreground">{courseResult.title}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-0.5">Description</p>
                <p className="text-sm text-foreground leading-relaxed">
                  {courseResult.description}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
