'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpen, FlaskConical, Search, Loader2, CheckCircle, ChevronRight, Clock, Cpu, Zap, BarChart3, FileText, Brain, ChevronDown, ChevronUp, X, } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
// ─── Agent Definitions ────────────────────────────────────────────────────────
const AGENTS = [
    {
        id: 'study-plan',
        name: 'Study Plan Generator',
        description: 'Get a personalized weekly study schedule based on your performance, gaps, and enrolled courses',
        icon: BookOpen,
        expectedOutputs: ['Weekly Schedule (4 weeks)', 'Flashcard Suggestions', 'Weak Areas Analysis'],
        estimatedSeconds: 45,
        color: 'from-blue-500 to-indigo-600',
        inputFields: [
            {
                key: 'subjects',
                label: 'Subjects / Focus Areas',
                type: 'text',
                placeholder: 'e.g. Algebra, World History, Biology...',
            },
        ],
    },
    {
        id: 'lesson-generator',
        name: 'Lesson Generator',
        description: 'Create a complete lesson from any topic including outline, section content, quiz questions, and summary',
        icon: FlaskConical,
        expectedOutputs: ['5-Section Lesson Outline', 'Section Content', '5 Quiz Questions', 'Summary & Key Takeaways'],
        estimatedSeconds: 60,
        color: 'from-violet-500 to-purple-600',
        inputFields: [
            {
                key: 'topic',
                label: 'Topic',
                type: 'text',
                placeholder: 'e.g. Photosynthesis, The French Revolution...',
                required: true,
            },
            {
                key: 'gradeLevel',
                label: 'Grade Level',
                type: 'select',
                options: ['K-5', '6-8', '9-12', 'Undergraduate', 'Graduate'],
                defaultValue: '9-12',
            },
            {
                key: 'duration',
                label: 'Lesson Duration (minutes)',
                type: 'select',
                options: ['30', '45', '60', '90'],
                defaultValue: '60',
            },
        ],
    },
    {
        id: 'research-assistant',
        name: 'Research Assistant',
        description: 'Research any topic and automatically generate a structured summary, flashcard deck, and visual mind map',
        icon: Search,
        expectedOutputs: ['Structured Research Summary', '10 Flashcards', 'Interactive Mind Map'],
        estimatedSeconds: 60,
        color: 'from-emerald-500 to-teal-600',
        inputFields: [
            {
                key: 'topic',
                label: 'Research Topic',
                type: 'text',
                placeholder: 'e.g. Climate Change, Quantum Computing, Renaissance Art...',
                required: true,
            },
            {
                key: 'depth',
                label: 'Research Depth',
                type: 'select',
                options: ['brief', 'detailed', 'comprehensive'],
                defaultValue: 'detailed',
            },
        ],
    },
];
// ─── Result Viewers ───────────────────────────────────────────────────────────
function StudyPlanResult({ outputs }) {
    const plan = (outputs['structure_schedule'] ?? outputs['analyze_and_schedule']);
    const flashcards = (outputs['generate_flashcard_prompts']);
    const [openWeek, setOpenWeek] = useState(0);
    const schedule = plan?.weeklySchedule ?? [];
    const weeks = Array.isArray(schedule) ? schedule : [];
    const weakAreas = plan?.weakAreas ?? [];
    const fcSuggestions = flashcards?.flashcardSuggestions ?? [];
    return (<div className="space-y-6">
      {weakAreas.length > 0 && (<div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-amber-800 mb-2">Identified Weak Areas</h3>
          <div className="flex flex-wrap gap-2">
            {weakAreas.map((area, i) => (<span key={i} className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">{area}</span>))}
          </div>
        </div>)}

      {weeks.length > 0 ? (<div className="border border-border rounded-xl overflow-hidden">
          <div className="bg-primary/5 px-4 py-3">
            <h3 className="font-semibold text-foreground">4-Week Study Schedule</h3>
          </div>
          <div className="divide-y divide-border">
            {weeks.map((week, i) => (<div key={i}>
                <button onClick={() => setOpenWeek(openWeek === i ? null : i)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-accent transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center">{week.week}</span>
                    <span className="text-sm font-medium text-foreground">{week.theme}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {week.weeklyHours && (<span className="text-xs text-muted-foreground">{week.weeklyHours}h/week</span>)}
                    {openWeek === i ? <ChevronUp className="h-4 w-4 text-muted-foreground"/> : <ChevronDown className="h-4 w-4 text-muted-foreground"/>}
                  </div>
                </button>
                {openWeek === i && (<div className="px-4 pb-4 space-y-3">
                    {week.goals?.length > 0 && (<div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Goals</p>
                        <ul className="space-y-1">
                          {week.goals.map((g, j) => (<li key={j} className="text-xs text-foreground flex gap-2">
                              <CheckCircle className="h-3 w-3 text-green-500 shrink-0 mt-0.5"/>{g}
                            </li>))}
                        </ul>
                      </div>)}
                    {week.days?.map((day, j) => (<div key={j} className="border border-border rounded-lg p-3">
                        <p className="text-xs font-semibold text-primary mb-2">{day.day}</p>
                        {day.sessions?.map((session, k) => (<div key={k} className="flex items-start gap-2 mb-1.5 last:mb-0">
                            <span className={cn('text-xs px-1.5 py-0.5 rounded shrink-0', session.priority === 'high' ? 'bg-red-100 text-red-700' :
                                session.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-green-100 text-green-700')}>
                              {session.duration}m
                            </span>
                            <div>
                              <span className="text-xs font-medium text-foreground">{session.subject}</span>
                              <span className="text-xs text-muted-foreground"> — {session.topic}</span>
                            </div>
                          </div>))}
                      </div>))}
                  </div>)}
              </div>))}
          </div>
        </div>) : (<div className="border border-border rounded-xl p-4 bg-muted/30">
          <p className="text-sm font-medium text-foreground mb-2">Study Plan Generated</p>
          <pre className="text-xs text-muted-foreground overflow-auto max-h-96 whitespace-pre-wrap">
            {JSON.stringify(plan, null, 2)}
          </pre>
        </div>)}

      {fcSuggestions.length > 0 && (<div className="border border-border rounded-xl overflow-hidden">
          <div className="bg-primary/5 px-4 py-3">
            <h3 className="font-semibold text-foreground">Flashcard Suggestions</h3>
          </div>
          <div className="divide-y divide-border">
            {fcSuggestions.slice(0, 3).map((group, i) => (<div key={i} className="p-4">
                <p className="text-xs font-semibold text-primary uppercase mb-2">{group.topic}</p>
                <div className="space-y-2">
                  {group.cards?.slice(0, 3).map((card, j) => (<div key={j} className="flex gap-3 text-sm">
                      <span className="shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">{j + 1}</span>
                      <span className="text-foreground">{card.front}</span>
                    </div>))}
                </div>
              </div>))}
          </div>
        </div>)}
    </div>);
}
function LessonResult({ outputs }) {
    const outline = outputs['generate_outline'];
    const quiz = outputs['generate_quiz'];
    const summary = outputs['generate_summary'];
    const [openSection, setOpenSection] = useState(0);
    const [activeTab, setActiveTab] = useState('lesson');
    const sections = outline?.sections ?? [];
    const questions = quiz?.questions ?? [];
    return (<div className="space-y-4">
      <div className="flex gap-2">
        {['lesson', 'quiz', 'summary'].map(tab => (<button key={tab} onClick={() => setActiveTab(tab)} className={cn('px-4 py-2 text-sm font-medium rounded-lg border transition-colors capitalize', activeTab === tab
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border text-muted-foreground hover:bg-accent')}>
            {tab === 'quiz' ? 'Quiz' : tab === 'summary' ? 'Summary' : 'Lesson'}
          </button>))}
      </div>

      {activeTab === 'lesson' && (<div className="border border-border rounded-xl overflow-hidden">
          {outline?.title && (<div className="bg-primary/5 px-4 py-3">
              <h3 className="font-semibold text-foreground">{outline.title}</h3>
              {outline.learningObjectives?.length > 0 && (<div className="flex flex-wrap gap-1.5 mt-2">
                  {outline.learningObjectives.map((obj, i) => (<span key={i} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{obj}</span>))}
                </div>)}
            </div>)}
          <div className="divide-y divide-border">
            {sections.length > 0 ? sections.map((section, i) => (<div key={i}>
                <button onClick={() => setOpenSection(openSection === i ? null : i)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-accent transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold bg-primary/10 text-primary rounded px-1.5 py-0.5">{i + 1}</span>
                    <span className="text-sm font-medium text-foreground">{section.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {section.durationMinutes && <span className="text-xs text-muted-foreground">{section.durationMinutes}m</span>}
                    {openSection === i ? <ChevronUp className="h-4 w-4 text-muted-foreground"/> : <ChevronDown className="h-4 w-4 text-muted-foreground"/>}
                  </div>
                </button>
                {openSection === i && (<div className="px-4 pb-4 space-y-3">
                    {section.keyPoints?.length > 0 && (<ul className="space-y-1">
                        {section.keyPoints.map((pt, j) => (<li key={j} className="text-sm text-foreground flex gap-2">
                            <ChevronRight className="h-4 w-4 text-primary shrink-0 mt-0.5"/>{pt}
                          </li>))}
                      </ul>)}
                    {(() => {
                        const sectionOutput = outputs[`generate_section_${i + 1}`];
                        return sectionOutput?.content ? (<p className="text-sm text-foreground leading-relaxed bg-muted/30 p-3 rounded-lg">{sectionOutput.content}</p>) : null;
                    })()}
                  </div>)}
              </div>)) : (<div className="p-4">
                <pre className="text-xs text-muted-foreground overflow-auto max-h-80 whitespace-pre-wrap">
                  {JSON.stringify(outline, null, 2)}
                </pre>
              </div>)}
          </div>
        </div>)}

      {activeTab === 'quiz' && (<div className="border border-border rounded-xl overflow-hidden">
          <div className="bg-primary/5 px-4 py-3">
            <h3 className="font-semibold text-foreground">Quiz Questions ({questions.length})</h3>
          </div>
          {questions.length > 0 ? (<ol className="divide-y divide-border">
              {questions.map((q, i) => (<li key={i} className="p-4">
                  <div className="flex items-start gap-2 mb-3">
                    <span className="text-xs font-bold bg-primary/10 text-primary rounded px-1.5 py-0.5 shrink-0">{i + 1}</span>
                    <p className="text-sm font-medium text-foreground">{q.question}</p>
                  </div>
                  {q.options && (<div className="ml-6 space-y-1 mb-2">
                      {q.options.map((opt, j) => (<div key={j} className={cn('text-sm px-2 py-1 rounded', q.correctAnswer === opt || q.correctAnswer === String.fromCharCode(65 + j) ? 'bg-green-50 text-green-700 font-medium' : 'text-foreground')}>
                          <span className="font-medium text-muted-foreground mr-1">{String.fromCharCode(65 + j)}.</span>{opt}
                        </div>))}
                    </div>)}
                  {q.explanation && (<p className="ml-6 text-xs text-muted-foreground italic">{q.explanation}</p>)}
                </li>))}
            </ol>) : (<div className="p-4">
              <pre className="text-xs text-muted-foreground overflow-auto max-h-80 whitespace-pre-wrap">
                {JSON.stringify(quiz, null, 2)}
              </pre>
            </div>)}
        </div>)}

      {activeTab === 'summary' && summary && (<div className="border border-border rounded-xl p-4 space-y-4">
          {summary.summary && (<div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Summary</h4>
              <p className="text-sm text-foreground leading-relaxed">{summary.summary}</p>
            </div>)}
          {summary.keyTakeaways?.length > 0 && (<div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Key Takeaways</h4>
              <ul className="space-y-2">
                {summary.keyTakeaways.map((t, i) => (<li key={i} className="flex gap-2 text-sm text-foreground">
                    <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5"/>{t}
                  </li>))}
              </ul>
            </div>)}
          {summary.nextTopics?.length > 0 && (<div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Next Topics to Explore</h4>
              <div className="flex flex-wrap gap-2">
                {summary.nextTopics.map((t, i) => (<span key={i} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">{t}</span>))}
              </div>
            </div>)}
        </div>)}
    </div>);
}
function ResearchResult({ outputs }) {
    const summary = outputs['synthesize_research'];
    const flashcards = outputs['generate_flashcards'];
    const mindMap = outputs['generate_mind_map'];
    const [activeTab, setActiveTab] = useState('summary');
    const [currentCard, setCurrentCard] = useState(0);
    const [flipped, setFlipped] = useState(false);
    const [expandedNodes, setExpandedNodes] = useState(new Set());
    const cards = flashcards?.flashcards ?? [];
    const nodes = mindMap?.nodes ?? [];
    const sections = summary?.sections ?? [];
    const toggleNode = (id) => {
        setExpandedNodes(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };
    const rootNodes = nodes.filter((n) => !n.parentId);
    const childMap = nodes.reduce((acc, n) => {
        if (n.parentId) {
            if (!acc[n.parentId]) {
                acc[n.parentId] = [];
            }
            acc[n.parentId].push(n);
        }
        return acc;
    }, {});
    return (<div className="space-y-4">
      <div className="flex gap-2">
        {['summary', 'flashcards', 'mindmap'].map(tab => (<button key={tab} onClick={() => setActiveTab(tab)} className={cn('px-4 py-2 text-sm font-medium rounded-lg border transition-colors capitalize', activeTab === tab
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border text-muted-foreground hover:bg-accent')}>
            {tab === 'mindmap' ? 'Mind Map' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>))}
      </div>

      {activeTab === 'summary' && (<div className="space-y-4">
          {summary?.abstract && (<div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
              <p className="text-sm text-foreground leading-relaxed">{summary.abstract}</p>
            </div>)}
          {sections.length > 0 ? (<div className="space-y-3">
              {sections.map((section, i) => (<div key={i} className="border border-border rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-foreground mb-2">{section.heading}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{section.content}</p>
                  {section.keyFacts?.length > 0 && (<ul className="mt-3 space-y-1">
                      {section.keyFacts.map((fact, j) => (<li key={j} className="text-xs text-foreground flex gap-2">
                          <ChevronRight className="h-3 w-3 text-primary shrink-0 mt-0.5"/>{fact}
                        </li>))}
                    </ul>)}
                </div>))}
            </div>) : (<div className="border border-border rounded-xl p-4 bg-muted/30">
              <pre className="text-xs text-muted-foreground overflow-auto max-h-96 whitespace-pre-wrap">
                {JSON.stringify(summary, null, 2)}
              </pre>
            </div>)}
          {summary?.conclusion && (<div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <h4 className="text-xs font-semibold text-green-700 uppercase mb-1">Conclusion</h4>
              <p className="text-sm text-green-900">{summary.conclusion}</p>
            </div>)}
        </div>)}

      {activeTab === 'flashcards' && (<div className="space-y-4">
          {cards.length > 0 ? (<>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Card {currentCard + 1} / {cards.length}</span>
                <span className="text-xs">{flipped ? 'Answer' : 'Question'} — click to flip</span>
              </div>
              <button onClick={() => setFlipped(f => !f)} className="w-full min-h-40 border-2 border-primary/30 rounded-2xl p-6 text-center transition-all hover:border-primary hover:shadow-md bg-card cursor-pointer">
                {flipped ? (<div>
                    <p className="text-xs font-semibold text-primary uppercase mb-3">Answer</p>
                    <p className="text-base text-foreground leading-relaxed">{cards[currentCard]?.back}</p>
                  </div>) : (<div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-3">Question</p>
                    <p className="text-base font-medium text-foreground leading-relaxed">{cards[currentCard]?.front}</p>
                    {cards[currentCard]?.hint && (<p className="text-xs text-muted-foreground mt-2 italic">Hint: {cards[currentCard].hint}</p>)}
                  </div>)}
              </button>
              <div className="flex items-center justify-between gap-3">
                <Button variant="outline" onClick={() => { setCurrentCard(i => Math.max(0, i - 1)); setFlipped(false); }} disabled={currentCard === 0}>
                  Previous
                </Button>
                <div className="flex gap-1">
                  {cards.map((_, i) => (<button key={i} onClick={() => { setCurrentCard(i); setFlipped(false); }} className={cn('w-2 h-2 rounded-full transition-colors', i === currentCard ? 'bg-primary' : 'bg-border hover:bg-muted-foreground')}/>))}
                </div>
                <Button variant="outline" onClick={() => { setCurrentCard(i => Math.min(cards.length - 1, i + 1)); setFlipped(false); }} disabled={currentCard === cards.length - 1}>
                  Next
                </Button>
              </div>
            </>) : (<div className="border border-border rounded-xl p-4 bg-muted/30">
              <pre className="text-xs text-muted-foreground overflow-auto max-h-80 whitespace-pre-wrap">
                {JSON.stringify(flashcards, null, 2)}
              </pre>
            </div>)}
        </div>)}

      {activeTab === 'mindmap' && (<div className="border border-border rounded-xl overflow-hidden">
          {mindMap?.central && (<div className="bg-primary px-4 py-3 text-center">
              <span className="text-base font-bold text-primary-foreground">{mindMap.central}</span>
            </div>)}
          <div className="p-4 space-y-2 max-h-[500px] overflow-y-auto">
            {rootNodes.length > 0 ? rootNodes.map((node) => (<div key={node.id} className="border border-border rounded-lg overflow-hidden">
                <button onClick={() => toggleNode(node.id)} className="w-full flex items-center justify-between px-4 py-2.5 bg-accent hover:bg-accent/80 transition-colors font-medium text-sm">
                  <span className="text-foreground">{node.label}</span>
                  {childMap[node.id]?.length > 0 && (expandedNodes.has(node.id)
                    ? <ChevronUp className="h-4 w-4 text-muted-foreground"/>
                    : <ChevronDown className="h-4 w-4 text-muted-foreground"/>)}
                </button>
                {expandedNodes.has(node.id) && childMap[node.id]?.length > 0 && (<div className="px-4 py-2 space-y-1 bg-muted/30">
                    {childMap[node.id].map((child) => (<div key={child.id} className="flex items-start gap-2 text-sm text-foreground">
                        <span className="text-muted-foreground mt-1">•</span>
                        <div>
                          <span className="font-medium">{child.label}</span>
                          {child.description && (<p className="text-xs text-muted-foreground">{child.description}</p>)}
                        </div>
                      </div>))}
                  </div>)}
              </div>)) : ((mindMap?.branches ?? []).map((branch, i) => (<div key={i} className="border border-border rounded-lg overflow-hidden">
                  <button onClick={() => toggleNode(String(i))} className="w-full flex items-center justify-between px-4 py-2.5 bg-accent hover:bg-accent/80 transition-colors">
                    <span className="font-medium text-sm text-foreground">{branch.label}</span>
                    {expandedNodes.has(String(i)) ? <ChevronUp className="h-4 w-4"/> : <ChevronDown className="h-4 w-4"/>}
                  </button>
                  {expandedNodes.has(String(i)) && (<div className="px-4 py-2 space-y-1 bg-muted/30">
                      {branch.children?.map((child, j) => (<div key={j} className="text-sm text-foreground flex gap-2">
                          <span className="text-muted-foreground">•</span>
                          {typeof child === 'string' ? child : child.label}
                        </div>))}
                    </div>)}
                </div>)))}
          </div>
        </div>)}
    </div>);
}
function RunModal({ agent, onClose, onComplete }) {
    const [formValues, setFormValues] = useState(() => Object.fromEntries(agent.inputFields.map(f => [f.key, f.defaultValue ?? ''])));
    const [progress, setProgress] = useState(0);
    const [currentStep, setCurrentStep] = useState('');
    const [result, setResult] = useState(null);
    const mutation = useMutation({
        mutationFn: () => {
            const input = { ...formValues };
            if (agent.id === 'lesson-generator' && input['duration']) {
                input['duration'] = Number(input['duration']);
            }
            return api.post(`/ai/agents/pipelines/${agent.id}/run`, input).then(r => r.data.data ?? r.data);
        },
        onSuccess: (run) => {
            setProgress(100);
            setCurrentStep('Complete');
            setResult(run);
            onComplete(run);
        },
    });
    const progressInterval = useRef(null);
    useEffect(() => {
        if (mutation.isPending) {
            setProgress(0);
            const stepNames = ['Initializing...', 'Fetching context...', 'Running AI analysis...', 'Generating content...', 'Assembling output...'];
            let stepIdx = 0;
            let prog = 0;
            progressInterval.current = setInterval(() => {
                prog = Math.min(prog + Math.random() * 8, 90);
                setProgress(Math.round(prog));
                if (prog > stepIdx * 18) {
                    setCurrentStep(stepNames[Math.min(stepIdx, stepNames.length - 1)]);
                    stepIdx++;
                }
            }, 500);
        }
        else {
            if (progressInterval.current) {
                clearInterval(progressInterval.current);
            }
        }
        return () => {
            if (progressInterval.current) {
                clearInterval(progressInterval.current);
            }
        };
    }, [mutation.isPending]);
    const Icon = agent.icon;
    return (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        <div className={cn('p-6 bg-gradient-to-r text-white flex items-start justify-between', agent.color)}>
          <div className="flex items-start gap-4">
            <div className="p-2 bg-white/20 rounded-xl">
              <Icon className="h-6 w-6 text-white"/>
            </div>
            <div>
              <h2 className="text-xl font-bold">{agent.name}</h2>
              <p className="text-sm text-white/80 mt-0.5">{agent.description}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors ml-4">
            <X className="h-5 w-5"/>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!result ? (<>
              {!mutation.isPending && (<div className="space-y-4">
                  {agent.inputFields.map(field => (<div key={field.key}>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        {field.label}{field.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      {field.type === 'select' ? (<select value={String(formValues[field.key] ?? '')} onChange={e => setFormValues(v => ({ ...v, [field.key]: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary">
                          {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>) : field.type === 'number' ? (<input type="number" value={Number(formValues[field.key] ?? 0)} onChange={e => setFormValues(v => ({ ...v, [field.key]: +e.target.value }))} className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"/>) : (<input type="text" value={String(formValues[field.key] ?? '')} onChange={e => setFormValues(v => ({ ...v, [field.key]: e.target.value }))} placeholder={field.placeholder} className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"/>)}
                    </div>))}

                  <div className="bg-muted/50 rounded-xl p-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Expected Outputs</p>
                    <ul className="space-y-1">
                      {agent.expectedOutputs.map((output, i) => (<li key={i} className="text-sm text-foreground flex gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5"/>{output}
                        </li>))}
                    </ul>
                    <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                      <Clock className="h-3 w-3"/>Est. {Math.floor(agent.estimatedSeconds / 60)}m {agent.estimatedSeconds % 60}s
                    </p>
                  </div>
                </div>)}

              {mutation.isPending && (<div className="space-y-4">
                  <div className="flex items-center gap-3 text-sm text-foreground">
                    <Loader2 className="h-5 w-5 animate-spin text-primary"/>
                    <span className="font-medium">{currentStep || 'Starting pipeline...'}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                    <div className="h-3 rounded-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-500" style={{ width: `${progress}%` }}/>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">{progress}% — AI agents are processing your request</p>
                  <div className="space-y-2">
                    {agent.expectedOutputs.map((output, i) => (<div key={i} className={cn('flex items-center gap-2 text-sm transition-colors', progress > (i + 1) * (80 / agent.expectedOutputs.length) ? 'text-foreground' : 'text-muted-foreground')}>
                        {progress > (i + 1) * (80 / agent.expectedOutputs.length)
                        ? <CheckCircle className="h-4 w-4 text-green-500 shrink-0"/>
                        : <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 shrink-0"/>}
                        {output}
                      </div>))}
                  </div>
                </div>)}

              {mutation.isError && (<div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
                  Failed to run agent. Please try again.
                </div>)}
            </>) : (<div className="space-y-4">
              <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">
                <CheckCircle className="h-5 w-5 shrink-0"/>
                <div className="text-sm">
                  <span className="font-medium">Completed successfully</span>
                  <span className="text-green-600 ml-2">· {result.tokensUsed.toLocaleString()} tokens · ${result.costUsd.toFixed(4)}</span>
                </div>
              </div>

              {agent.id === 'study-plan' && <StudyPlanResult outputs={result.outputs}/>}
              {agent.id === 'lesson-generator' && <LessonResult outputs={result.outputs}/>}
              {agent.id === 'research-assistant' && <ResearchResult outputs={result.outputs}/>}
            </div>)}
        </div>

        <div className="border-t border-border p-4 flex justify-between items-center">
          <Button variant="outline" onClick={onClose}>
            {result ? 'Close' : 'Cancel'}
          </Button>
          {!result && (<Button onClick={() => mutation.mutate()} disabled={mutation.isPending || agent.inputFields.filter(f => f.required).some(f => !formValues[f.key])} className={cn('bg-gradient-to-r text-white border-0', agent.color)}>
              {mutation.isPending ? (<><Loader2 className="h-4 w-4 animate-spin mr-2"/>Running Pipeline...</>) : (<><Zap className="h-4 w-4 mr-2"/>Run Agent</>)}
            </Button>)}
        </div>
      </div>
    </div>);
}
// ─── Recent Runs ──────────────────────────────────────────────────────────────
function RecentRuns() {
    const { data, isLoading } = useQuery({
        queryKey: ['agent-runs'],
        queryFn: () => api.get('/ai/agents/runs?limit=10').then(r => (r.data.data ?? r.data)),
    });
    const runs = Array.isArray(data) ? data : [];
    if (isLoading) {
        return (<div className="flex items-center gap-2 text-sm text-muted-foreground p-4">
        <Loader2 className="h-4 w-4 animate-spin"/>Loading recent runs...
      </div>);
    }
    if (runs.length === 0) {
        return (<p className="text-sm text-muted-foreground p-4 text-center">No runs yet. Run an agent above to get started.</p>);
    }
    const agentById = Object.fromEntries(AGENTS.map(a => [a.id, a]));
    return (<div className="divide-y divide-border">
      {runs.map(run => {
            const agent = agentById[run.pipelineId];
            const Icon = agent?.icon ?? Brain;
            return (<div key={run.id} className="flex items-center gap-4 p-4 hover:bg-accent/50 transition-colors">
            <div className={cn('p-2 rounded-lg bg-gradient-to-br text-white', agent?.color ?? 'from-gray-400 to-gray-600')}>
              <Icon className="h-4 w-4"/>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{agent?.name ?? run.pipelineId}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(run.startedAt).toLocaleString()} · {run.tokensUsed.toLocaleString()} tokens
              </p>
            </div>
            <span className={cn('text-xs font-medium px-2 py-1 rounded-full', run.status === 'completed' ? 'bg-green-100 text-green-700' :
                    run.status === 'failed' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700')}>
              {run.status}
            </span>
          </div>);
        })}
    </div>);
}
// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AIAgentsPage() {
    const [selectedAgent, setSelectedAgent] = useState(null);
    const queryClient = useQueryClient();
    const handleComplete = (run) => {
        void queryClient.invalidateQueries({ queryKey: ['agent-runs'] });
    };
    return (<div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">AI Agents Platform</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Multi-step AI pipelines that chain multiple capabilities together to accomplish complex educational tasks.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
            { label: 'Available Pipelines', value: '3', icon: Cpu, color: 'text-blue-600 bg-blue-50' },
            { label: 'AI Steps per Run', value: 'Up to 12', icon: BarChart3, color: 'text-violet-600 bg-violet-50' },
            { label: 'Output Types', value: 'Plans, Lessons, Research', icon: FileText, color: 'text-emerald-600 bg-emerald-50' },
        ].map(stat => (<div key={stat.label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <div className={cn('p-2 rounded-lg', stat.color)}>
              <stat.icon className="h-5 w-5"/>
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </div>))}
      </div>

      <div>
        <h2 className="text-base font-semibold text-foreground mb-4">Available Agents</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {AGENTS.map(agent => {
            const Icon = agent.icon;
            return (<div key={agent.id} className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg transition-shadow group">
                <div className={cn('p-5 bg-gradient-to-br text-white', agent.color)}>
                  <div className="flex items-start justify-between">
                    <div className="p-2 bg-white/20 rounded-xl">
                      <Icon className="h-6 w-6 text-white"/>
                    </div>
                    <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                      ~{Math.floor(agent.estimatedSeconds / 60)}m {agent.estimatedSeconds % 60}s
                    </span>
                  </div>
                  <h3 className="text-lg font-bold mt-3">{agent.name}</h3>
                  <p className="text-sm text-white/80 mt-1 leading-relaxed">{agent.description}</p>
                </div>

                <div className="p-5 space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Outputs</p>
                    <ul className="space-y-1">
                      {agent.expectedOutputs.map((output, i) => (<li key={i} className="text-sm text-foreground flex gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5"/>
                          {output}
                        </li>))}
                    </ul>
                  </div>

                  <Button onClick={() => setSelectedAgent(agent)} className={cn('w-full bg-gradient-to-r text-white border-0', agent.color)}>
                    <Zap className="h-4 w-4 mr-2"/>Run Agent
                  </Button>
                </div>
              </div>);
        })}
        </div>
      </div>

      <div>
        <h2 className="text-base font-semibold text-foreground mb-4">Recent Runs</h2>
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <RecentRuns />
        </div>
      </div>

      {selectedAgent && (<RunModal agent={selectedAgent} onClose={() => setSelectedAgent(null)} onComplete={handleComplete}/>)}
    </div>);
}
