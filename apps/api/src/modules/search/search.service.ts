import { Injectable, Logger } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(private readonly elasticsearchService: ElasticsearchService) {}

  async indexCourse(course: { id: string; title: string; description?: string | null; category?: string | null; tags: string[]; teacherName: string; tenantId: string }) {
    try {
      await this.elasticsearchService.index({
        index: 'courses',
        id: course.id,
        document: {
          title: course.title,
          description: course.description,
          category: course.category,
          tags: course.tags,
          teacherName: course.teacherName,
          tenantId: course.tenantId,
          indexedAt: new Date(),
        },
      });
    } catch (err) {
      this.logger.error('Failed to index course', err);
    }
  }

  async searchCourses(query: string, tenantId: string, filters?: { category?: string; level?: string }, page = 1, limit = 20) {
    try {
      const from = (page - 1) * limit;
      const must: unknown[] = [
        { multi_match: { query, fields: ['title^3', 'description', 'tags^2', 'teacherName'], type: 'best_fields', fuzziness: 'AUTO' } },
        { term: { tenantId } },
      ];
      if (filters?.category) must.push({ term: { category: filters.category } });

      const result = await this.elasticsearchService.search({
        index: 'courses',
        from,
        size: limit,
        query: { bool: { must } },
        highlight: { fields: { title: {}, description: {} } },
      });

      return {
        hits: result.hits.hits.map(h => ({ id: h._id, score: h._score, ...h._source, highlights: h.highlight })),
        total: typeof result.hits.total === 'number' ? result.hits.total : result.hits.total?.value ?? 0,
        page,
        limit,
      };
    } catch (err) {
      this.logger.error('Search failed', err);
      return { hits: [], total: 0, page, limit };
    }
  }

  async deleteDocument(index: string, id: string) {
    try {
      await this.elasticsearchService.delete({ index, id });
    } catch (err) {
      this.logger.error(`Failed to delete document ${id} from ${index}`, err);
    }
  }

  async createIndices() {
    const indices = [
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
            indexedAt: { type: 'date' },
          },
        },
      },
    ];

    for (const { index, mappings } of indices) {
      const exists = await this.elasticsearchService.indices.exists({ index });
      if (!exists) {
        await this.elasticsearchService.indices.create({ index, mappings } as any);
        this.logger.log(`Created index: ${index}`);
      }
    }
  }
}
