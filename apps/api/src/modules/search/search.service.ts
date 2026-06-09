import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';

export interface ExamHit {
  id: string;
  title: string;
  subject: string;
  topic?: string;
  difficulty: string;
  tenantId: string;
  score?: number;
}

export interface CourseHit {
  id: string;
  title: string;
  description?: string;
  category?: string;
  tags: string[];
  teacherName: string;
  tenantId: string;
  score?: number;
  highlights?: { title?: string; description?: string };
}

export interface UserHit {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  tenantId: string;
  score?: number;
}

@Injectable()
export class SearchService implements OnModuleInit {
  private readonly logger = new Logger(SearchService.name);

  constructor(private readonly es: ElasticsearchService) {}

  async onModuleInit() {
    try {
      await this.createIndices();
    } catch (err) {
      this.logger.warn('Elasticsearch not available at startup — search will degrade gracefully', err);
    }
  }

  // ── Index management ──────────────────────────────────────────────────────

  async createIndices() {
    const defs = [
      {
        index: 'courses',
        mappings: {
          properties: {
            title: { type: 'text', analyzer: 'english' },
            description: { type: 'text', analyzer: 'english' },
            category: { type: 'keyword' },
            tags: { type: 'keyword' },
            teacherName: { type: 'text' },
            tenantId: { type: 'keyword' },
            level: { type: 'keyword' },
            isPublished: { type: 'boolean' },
            indexedAt: { type: 'date' },
          },
        },
      },
      {
        index: 'users',
        mappings: {
          properties: {
            firstName: { type: 'text' },
            lastName: { type: 'text' },
            email: { type: 'keyword' },
            role: { type: 'keyword' },
            tenantId: { type: 'keyword' },
            indexedAt: { type: 'date' },
          },
        },
      },
      {
        index: 'exams',
        mappings: {
          properties: {
            title: { type: 'text', analyzer: 'english' },
            subject: { type: 'text', analyzer: 'english' },
            topic: { type: 'text' },
            difficulty: { type: 'keyword' },
            tenantId: { type: 'keyword' },
            isPublished: { type: 'boolean' },
            indexedAt: { type: 'date' },
          },
        },
      },
    ];

    for (const { index, mappings } of defs) {
      const exists = await this.es.indices.exists({ index });
      if (!exists) {
        await this.es.indices.create({ index, mappings } as any);
        this.logger.log(`Created ES index: ${index}`);
      }
    }
  }

  // ── Indexing ──────────────────────────────────────────────────────────────

  async indexCourse(course: {
    id: string; title: string; description?: string | null;
    category?: string | null; tags: string[]; teacherName: string;
    tenantId: string; level?: string; isPublished?: boolean;
  }) {
    try {
      await this.es.index({
        index: 'courses', id: course.id,
        document: { ...course, indexedAt: new Date() },
      });
    } catch (err) {
      this.logger.error('Failed to index course', err);
    }
  }

  async indexUser(user: {
    id: string; firstName: string; lastName: string;
    email: string; role: string; tenantId: string;
  }) {
    try {
      await this.es.index({
        index: 'users', id: user.id,
        document: { ...user, indexedAt: new Date() },
      });
    } catch (err) {
      this.logger.error('Failed to index user', err);
    }
  }

  async indexExam(exam: {
    id: string; title: string; subject: string; topic?: string | null;
    difficulty: string; tenantId: string; isPublished?: boolean;
  }) {
    try {
      await this.es.index({
        index: 'exams', id: exam.id,
        document: { ...exam, indexedAt: new Date() },
      });
    } catch (err) {
      this.logger.error('Failed to index exam', err);
    }
  }

  async deleteDocument(index: string, id: string) {
    try {
      await this.es.delete({ index, id });
    } catch (err) {
      this.logger.warn(`Failed to delete ${id} from ${index}`, err);
    }
  }

  // ── Individual searches ───────────────────────────────────────────────────

  async searchCourses(
    query: string, tenantId: string,
    filters?: { category?: string; level?: string },
    page = 1, limit = 20,
  ) {
    try {
      const must: any[] = [
        { multi_match: { query, fields: ['title^3', 'description', 'tags^2', 'teacherName'], fuzziness: 'AUTO' } },
        { term: { tenantId } },
      ];
      if (filters?.category) {must.push({ term: { category: filters.category } });}
      if (filters?.level) {must.push({ term: { level: filters.level } });}

      const result = await this.es.search({
        index: 'courses', from: (page - 1) * limit, size: limit,
        query: { bool: { must } },
        highlight: { fields: { title: {}, description: {} } },
      });

      return {
        hits: result.hits.hits.map(h => ({
          id: h._id, score: h._score,
          ...(h._source as object),
          highlights: h.highlight,
        })) as CourseHit[],
        total: typeof result.hits.total === 'number' ? result.hits.total : result.hits.total?.value ?? 0,
        page, limit,
      };
    } catch {
      return { hits: [] as CourseHit[], total: 0, page, limit };
    }
  }

  async searchUsers(
    query: string, tenantId: string,
    filters?: { role?: string },
    page = 1, limit = 20,
  ) {
    try {
      const must: any[] = [
        { multi_match: { query, fields: ['firstName^2', 'lastName^2', 'email'], fuzziness: 'AUTO' } },
        { term: { tenantId } },
      ];
      if (filters?.role) {must.push({ term: { role: filters.role } });}

      const result = await this.es.search({
        index: 'users', from: (page - 1) * limit, size: limit,
        query: { bool: { must } },
      });

      return {
        hits: result.hits.hits.map(h => ({ id: h._id, score: h._score, ...(h._source as object) })) as UserHit[],
        total: typeof result.hits.total === 'number' ? result.hits.total : result.hits.total?.value ?? 0,
        page, limit,
      };
    } catch {
      return { hits: [] as UserHit[], total: 0, page, limit };
    }
  }

  async searchExams(
    query: string, tenantId: string,
    filters?: { difficulty?: string },
    page = 1, limit = 20,
  ) {
    try {
      const must: any[] = [
        { multi_match: { query, fields: ['title^3', 'subject^2', 'topic'], fuzziness: 'AUTO' } },
        { term: { tenantId } },
      ];
      if (filters?.difficulty) {must.push({ term: { difficulty: filters.difficulty } });}

      const result = await this.es.search({
        index: 'exams', from: (page - 1) * limit, size: limit,
        query: { bool: { must } },
        highlight: { fields: { title: {}, subject: {} } },
      });

      return {
        hits: result.hits.hits.map(h => ({ id: h._id, score: h._score, ...(h._source as object) })) as ExamHit[],
        total: typeof result.hits.total === 'number' ? result.hits.total : result.hits.total?.value ?? 0,
        page, limit,
      };
    } catch {
      return { hits: [] as ExamHit[], total: 0, page, limit };
    }
  }

  // ── Unified search ────────────────────────────────────────────────────────

  async searchAll(query: string, tenantId: string, limit = 5) {
    const [courses, users, exams] = await Promise.all([
      this.searchCourses(query, tenantId, {}, 1, limit),
      this.searchUsers(query, tenantId, {}, 1, limit),
      this.searchExams(query, tenantId, {}, 1, limit),
    ]);
    return {
      courses: courses.hits,
      users: users.hits,
      exams: exams.hits,
      totals: {
        courses: courses.total,
        users: users.total,
        exams: exams.total,
        all: courses.total + users.total + exams.total,
      },
    };
  }

  // ── Autocomplete suggestions ──────────────────────────────────────────────

  async suggest(query: string, tenantId: string) {
    try {
      const [courses, exams] = await Promise.all([
        this.es.search({
          index: 'courses', size: 5,
          query: { bool: { must: [{ match_phrase_prefix: { title: query } }, { term: { tenantId } }] } },
          _source: ['title'],
        }),
        this.es.search({
          index: 'exams', size: 3,
          query: { bool: { must: [{ match_phrase_prefix: { title: query } }, { term: { tenantId } }] } },
          _source: ['title', 'subject'],
        }),
      ]);

      return [
        ...courses.hits.hits.map(h => ({ type: 'course' as const, id: h._id, label: (h._source as any).title })),
        ...exams.hits.hits.map(h => ({ type: 'exam' as const, id: h._id, label: (h._source as any).title ?? (h._source as any).subject })),
      ];
    } catch {
      return [];
    }
  }
}
