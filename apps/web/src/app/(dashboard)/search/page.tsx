'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Search, BookOpen, Users, X, Filter, FileQuestion } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CourseHit {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  teacherName: string;
  highlights?: {
    title?: string;
    description?: string;
  };
}

interface CourseSearchResponse {
  hits: CourseHit[];
  total: number;
  page: number;
  limit: number;
}

interface UserHit {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface UserSearchResponse {
  hits: UserHit[];
  total: number;
  page: number;
  limit: number;
}

interface ExamHit {
  id: string;
  title: string;
  subject: string;
  topic?: string;
  difficulty: string;
}

interface ExamSearchResponse {
  hits: ExamHit[];
  total: number;
  page: number;
  limit: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ALLOWED_TAGS_RE = /<(?!\/?em\b)[^>]*>/g;

function sanitizeHighlight(html: string): string {
  return html.replace(ALLOWED_TAGS_RE, '');
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();
}

const ROLE_COLORS: Record<string, string> = {
  STUDENT: 'bg-blue-100 text-blue-700',
  TEACHER: 'bg-green-100 text-green-700',
  ADMIN: 'bg-purple-100 text-purple-700',
  SUPER_ADMIN: 'bg-red-100 text-red-700',
  SCHOOL_ADMIN: 'bg-orange-100 text-orange-700',
  UNIVERSITY_ADMIN: 'bg-yellow-100 text-yellow-700',
  PARENT: 'bg-gray-100 text-gray-700',
};

const CATEGORIES = ['All', 'Mathematics', 'Science', 'History', 'Language', 'Technology', 'Arts'];
const LEVELS = ['All', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'];
const ROLES = ['All', 'STUDENT', 'TEACHER', 'ADMIN'];

const EXAMPLE_SEARCHES = ['Mathematics', 'JavaScript', 'Grade 10', 'Science', 'History'];

// ---------------------------------------------------------------------------
// Skeleton card
// ---------------------------------------------------------------------------

function SkeletonCard() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 animate-pulse">
      <div className="h-5 bg-gray-200 rounded w-2/3 mb-3" />
      <div className="h-4 bg-gray-100 rounded w-full mb-2" />
      <div className="h-4 bg-gray-100 rounded w-5/6 mb-4" />
      <div className="flex gap-2">
        <div className="h-5 bg-gray-200 rounded-full w-20" />
        <div className="h-5 bg-gray-200 rounded-full w-16" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Course result card
// ---------------------------------------------------------------------------

function CourseCard({ hit }: { hit: CourseHit }) {
  const titleHtml = hit.highlights?.title
    ? sanitizeHighlight(hit.highlights.title)
    : null;
  const descHtml = hit.highlights?.description
    ? sanitizeHighlight(hit.highlights.description)
    : null;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {titleHtml ? (
            <h3
              className="font-semibold text-gray-900 mb-1 [&_em]:bg-yellow-100 [&_em]:not-italic [&_em]:font-bold"
              dangerouslySetInnerHTML={{ __html: titleHtml }}
            />
          ) : (
            <h3 className="font-semibold text-gray-900 mb-1">{hit.title}</h3>
          )}
          {descHtml ? (
            <p
              className="text-sm text-gray-500 line-clamp-2 [&_em]:bg-yellow-100 [&_em]:not-italic [&_em]:font-semibold"
              dangerouslySetInnerHTML={{ __html: descHtml }}
            />
          ) : (
            <p className="text-sm text-gray-500 line-clamp-2">{hit.description}</p>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full font-medium border border-blue-100">
          {hit.category}
        </span>
        {hit.tags?.slice(0, 3).map((tag) => (
          <span key={tag} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-gray-400">by {hit.teacherName}</span>
        <Link
          href={`/courses/${hit.id}`}
          className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline"
        >
          View Course
        </Link>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// User result card
// ---------------------------------------------------------------------------

function UserCard({ hit }: { hit: UserHit }) {
  const href = hit.role === 'STUDENT' ? `/students/${hit.id}` : `/teachers/${hit.id}`;
  const badgeClass = ROLE_COLORS[hit.role] ?? 'bg-gray-100 text-gray-700';

  return (
    <Link
      href={href}
      className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4 hover:shadow-md transition-shadow"
    >
      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
        {getInitials(hit.firstName, hit.lastName)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 text-sm">
          {hit.firstName} {hit.lastName}
        </p>
        <p className="text-xs text-gray-500 truncate">{hit.email}</p>
      </div>
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${badgeClass}`}>
        {hit.role.replace('_', ' ')}
      </span>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Main search inner component (needs useSearchParams — wrapped in Suspense)
// ---------------------------------------------------------------------------

function SearchInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();

  const initialQ = searchParams.get('q') ?? '';
  const [inputValue, setInputValue] = useState(initialQ);
  const [debouncedQ, setDebouncedQ] = useState(initialQ);
  const [activeTab, setActiveTab] = useState<'courses' | 'people' | 'exams'>('courses');
  const [category, setCategory] = useState('All');
  const [level, setLevel] = useState('All');
  const [role, setRole] = useState('All');
  const [difficulty, setDifficulty] = useState('All');

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync input when URL param changes (e.g. navigating back/forward)
  useEffect(() => {
    setInputValue(initialQ);
    setDebouncedQ(initialQ);
  }, [initialQ]);

  const handleInputChange = (value: string) => {
    setInputValue(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQ(value);
      const params = new URLSearchParams();
      if (value.trim()) params.set('q', value.trim());
      router.replace(`/search${value.trim() ? `?${params.toString()}` : ''}`);
    }, 300);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setDebouncedQ(inputValue);
    const params = new URLSearchParams();
    if (inputValue.trim()) params.set('q', inputValue.trim());
    router.push(`/search${inputValue.trim() ? `?${params.toString()}` : ''}`);
  };

  const q = debouncedQ.trim();
  const queryEnabled = q.length >= 2;

  const canSeePeople =
    user?.role === 'TEACHER' ||
    user?.role === 'ADMIN' ||
    user?.role === 'SUPER_ADMIN' ||
    user?.role === 'SCHOOL_ADMIN' ||
    user?.role === 'UNIVERSITY_ADMIN';

  // Course search
  const {
    data: courseData,
    isLoading: coursesLoading,
    isFetching: coursesFetching,
  } = useQuery({
    queryKey: ['search-courses', q, category, level],
    queryFn: async () => {
      const params: Record<string, string> = { q, page: '1', limit: '20' };
      if (category !== 'All') params.category = category;
      if (level !== 'All') params.level = level;
      const res = await api.get<CourseSearchResponse>('/search/courses', { params });
      return res.data;
    },
    enabled: queryEnabled,
    staleTime: 30_000,
  });

  // People search
  const {
    data: userData,
    isLoading: usersLoading,
  } = useQuery({
    queryKey: ['search-users', q, role],
    queryFn: async () => {
      const params: Record<string, string> = { q, page: '1', limit: '20' };
      if (role !== 'All') params.role = role;
      const res = await api.get<UserSearchResponse>('/search/users', { params });
      return res.data;
    },
    enabled: queryEnabled && canSeePeople && activeTab === 'people',
    staleTime: 30_000,
  });

  // Exam search
  const {
    data: examData,
    isLoading: examsLoading,
  } = useQuery({
    queryKey: ['search-exams', q, difficulty],
    queryFn: async () => {
      const params: Record<string, string> = { q, page: '1', limit: '20' };
      if (difficulty !== 'All') params.difficulty = difficulty.toLowerCase();
      const res = await api.get<ExamSearchResponse>('/search/exams', { params });
      return res.data;
    },
    enabled: queryEnabled && activeTab === 'exams',
    staleTime: 30_000,
  });

  const courseCount = courseData?.total ?? 0;
  const peopleCount = userData?.total ?? 0;
  const examCount = examData?.total ?? 0;

  // ---------------------------------------------------------------------------
  // Empty state (no query)
  // ---------------------------------------------------------------------------

  if (!q) {
    return (
      <div className="space-y-6">
        <SearchBar
          value={inputValue}
          onChange={handleInputChange}
          onSubmit={handleSubmit}
        />
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <Search className="h-8 w-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Search the platform</h2>
          <p className="text-sm text-gray-500 mb-6">
            Find courses, people, and content across the platform
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {EXAMPLE_SEARCHES.map((term) => (
              <button
                key={term}
                onClick={() => handleInputChange(term)}
                className="px-4 py-1.5 rounded-full border border-gray-200 text-sm text-gray-700 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Results layout
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      <SearchBar
        value={inputValue}
        onChange={handleInputChange}
        onSubmit={handleSubmit}
      />

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-gray-200">
        <TabButton
          active={activeTab === 'courses'}
          onClick={() => setActiveTab('courses')}
          icon={<BookOpen className="h-4 w-4" />}
          label="Courses"
          count={queryEnabled ? courseCount : undefined}
          loading={coursesLoading || coursesFetching}
        />
        <TabButton
          active={activeTab === 'exams'}
          onClick={() => setActiveTab('exams')}
          icon={<FileQuestion className="h-4 w-4" />}
          label="Exams"
          count={queryEnabled && activeTab === 'exams' ? examCount : undefined}
          loading={examsLoading}
        />
        {canSeePeople && (
          <TabButton
            active={activeTab === 'people'}
            onClick={() => setActiveTab('people')}
            icon={<Users className="h-4 w-4" />}
            label="People"
            count={queryEnabled && activeTab === 'people' ? peopleCount : undefined}
            loading={usersLoading}
          />
        )}
      </div>

      {/* Courses tab */}
      {activeTab === 'courses' && (
        <div className="space-y-5">
          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-center">
            <Filter className="h-4 w-4 text-gray-400 shrink-0" />
            <FilterSelect
              value={category}
              onChange={setCategory}
              options={CATEGORIES}
              label="Category"
            />
            <FilterSelect
              value={level}
              onChange={setLevel}
              options={LEVELS}
              label="Level"
            />
            {(category !== 'All' || level !== 'All') && (
              <button
                onClick={() => { setCategory('All'); setLevel('All'); }}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800"
              >
                <X className="h-3.5 w-3.5" />
                Clear filters
              </button>
            )}
          </div>

          {/* Course results */}
          {coursesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : courseData?.hits?.length ? (
            <>
              <p className="text-sm text-gray-500">
                {courseCount} {courseCount === 1 ? 'course' : 'courses'} found
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {courseData.hits.map((hit) => (
                  <CourseCard key={hit.id} hit={hit} />
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <BookOpen className="h-10 w-10 text-gray-300 mb-3" />
              <p className="font-medium text-gray-700">No courses found for &ldquo;{q}&rdquo;</p>
              <p className="text-sm text-gray-400 mt-1">
                Try different keywords or adjust the filters above
              </p>
            </div>
          )}
        </div>
      )}

      {/* People tab */}
      {activeTab === 'people' && canSeePeople && (
        <div className="space-y-5">
          {/* Role filter */}
          <div className="flex flex-wrap gap-3 items-center">
            <Filter className="h-4 w-4 text-gray-400 shrink-0" />
            <div className="flex gap-2">
              {ROLES.map((r) => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    role === r
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* People results */}
          {usersLoading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4 animate-pulse">
                  <div className="h-10 w-10 rounded-full bg-gray-200 shrink-0" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-32 mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-48" />
                  </div>
                  <div className="h-5 bg-gray-200 rounded-full w-16" />
                </div>
              ))}
            </div>
          ) : userData?.hits?.length ? (
            <>
              <p className="text-sm text-gray-500">
                {peopleCount} {peopleCount === 1 ? 'person' : 'people'} found
              </p>
              <div className="space-y-3">
                {userData.hits.map((hit) => (
                  <UserCard key={hit.id} hit={hit} />
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Users className="h-10 w-10 text-gray-300 mb-3" />
              <p className="font-medium text-gray-700">No people found for &ldquo;{q}&rdquo;</p>
              <p className="text-sm text-gray-400 mt-1">
                Try different keywords or adjust the role filter
              </p>
            </div>
          )}
        </div>
      )}

      {/* Exams tab */}
      {activeTab === 'exams' && (
        <div className="space-y-5">
          <div className="flex flex-wrap gap-3 items-center">
            <Filter className="h-4 w-4 text-gray-400 shrink-0" />
            <div className="flex gap-2">
              {['All', 'Easy', 'Medium', 'Hard'].map((d) => (
                <button key={d} onClick={() => setDifficulty(d)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    difficulty === d ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  }`}>
                  {d}
                </button>
              ))}
            </div>
          </div>

          {examsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              <SkeletonCard /><SkeletonCard /><SkeletonCard />
            </div>
          ) : examData?.hits?.length ? (
            <>
              <p className="text-sm text-gray-500">{examCount} {examCount === 1 ? 'exam' : 'exams'} found</p>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {examData.hits.map((hit) => (
                  <ExamCard key={hit.id} hit={hit} />
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <FileQuestion className="h-10 w-10 text-gray-300 mb-3" />
              <p className="font-medium text-gray-700">No exams found for &ldquo;{q}&rdquo;</p>
              <p className="text-sm text-gray-400 mt-1">Try different keywords or adjust the difficulty filter</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ExamCard({ hit }: { hit: ExamHit }) {
  const DIFF_COLOR: Record<string, string> = { easy: 'bg-green-100 text-green-700', medium: 'bg-yellow-100 text-yellow-700', hard: 'bg-red-100 text-red-700' };
  return (
    <Link href={`/exams/${hit.id}`} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow block">
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold text-gray-900 text-sm">{hit.title}</h3>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 capitalize ${DIFF_COLOR[hit.difficulty] ?? 'bg-gray-100 text-gray-600'}`}>{hit.difficulty}</span>
      </div>
      <p className="text-xs text-gray-500">{hit.subject}{hit.topic ? ` · ${hit.topic}` : ''}</p>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SearchBar({
  value,
  onChange,
  onSubmit,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Search</h1>
      <form onSubmit={onSubmit} className="relative max-w-2xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
        <input
          type="search"
          autoFocus
          placeholder="Search courses, people, content..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-11 pl-10 pr-10 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </form>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
  count,
  loading,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count?: number;
  loading?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
        active
          ? 'border-blue-600 text-blue-600'
          : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
      }`}
    >
      {icon}
      {label}
      {!loading && count !== undefined && (
        <span
          className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
            active ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
          }`}
        >
          {count}
        </span>
      )}
      {loading && (
        <span className="h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
    </button>
  );
}

function FilterSelect({
  value,
  onChange,
  options,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  label: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={label}
      className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700"
    >
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt === 'All' ? `All ${label}s` : opt}
        </option>
      ))}
    </select>
  );
}

// ---------------------------------------------------------------------------
// Page export — Suspense boundary required for useSearchParams
// ---------------------------------------------------------------------------

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div>
            <div className="h-8 w-24 bg-gray-200 rounded animate-pulse mb-4" />
            <div className="h-11 max-w-2xl bg-gray-100 rounded-lg animate-pulse" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      }
    >
      <SearchInner />
    </Suspense>
  );
}
