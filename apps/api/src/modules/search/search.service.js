"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SearchService = void 0;
var _common = require("@nestjs/common");
var _elasticsearch = require("@nestjs/elasticsearch");
var __decorate = void 0 && (void 0).__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = void 0 && (void 0).__metadata || function (k, v) {
  if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = void 0 && (void 0).__param || function (paramIndex, decorator) {
  return function (target, key) {
    decorator(target, key, paramIndex);
  };
};
var SearchService_1;
/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */

let SearchService = exports.SearchService = SearchService_1 = class SearchService {
  logger = new _common.Logger(SearchService_1.name);
  constructor(es) {
    this.es = es;
  }
  async onModuleInit() {
    try {
      await this.createIndices();
    } catch (err) {
      this.logger.warn('Elasticsearch not available at startup — search will degrade gracefully', err);
    }
  }
  // ── Index management ──────────────────────────────────────────────────────
  async createIndices() {
    const defs = [{
      index: 'courses',
      mappings: {
        properties: {
          title: {
            type: 'text',
            analyzer: 'english'
          },
          description: {
            type: 'text',
            analyzer: 'english'
          },
          category: {
            type: 'keyword'
          },
          tags: {
            type: 'keyword'
          },
          teacherName: {
            type: 'text'
          },
          tenantId: {
            type: 'keyword'
          },
          level: {
            type: 'keyword'
          },
          isPublished: {
            type: 'boolean'
          },
          indexedAt: {
            type: 'date'
          }
        }
      }
    }, {
      index: 'users',
      mappings: {
        properties: {
          firstName: {
            type: 'text'
          },
          lastName: {
            type: 'text'
          },
          email: {
            type: 'keyword'
          },
          role: {
            type: 'keyword'
          },
          tenantId: {
            type: 'keyword'
          },
          indexedAt: {
            type: 'date'
          }
        }
      }
    }, {
      index: 'exams',
      mappings: {
        properties: {
          title: {
            type: 'text',
            analyzer: 'english'
          },
          subject: {
            type: 'text',
            analyzer: 'english'
          },
          topic: {
            type: 'text'
          },
          difficulty: {
            type: 'keyword'
          },
          tenantId: {
            type: 'keyword'
          },
          isPublished: {
            type: 'boolean'
          },
          indexedAt: {
            type: 'date'
          }
        }
      }
    }];
    for (const {
      index,
      mappings
    } of defs) {
      const exists = await this.es.indices.exists({
        index
      });
      if (!exists) {
        await this.es.indices.create({
          index,
          mappings
        });
        this.logger.log(`Created ES index: ${index}`);
      }
    }
  }
  // ── Indexing ──────────────────────────────────────────────────────────────
  async indexCourse(course) {
    try {
      await this.es.index({
        index: 'courses',
        id: course.id,
        document: {
          ...course,
          indexedAt: new Date()
        }
      });
    } catch (err) {
      this.logger.error('Failed to index course', err);
    }
  }
  async indexUser(user) {
    try {
      await this.es.index({
        index: 'users',
        id: user.id,
        document: {
          ...user,
          indexedAt: new Date()
        }
      });
    } catch (err) {
      this.logger.error('Failed to index user', err);
    }
  }
  async indexExam(exam) {
    try {
      await this.es.index({
        index: 'exams',
        id: exam.id,
        document: {
          ...exam,
          indexedAt: new Date()
        }
      });
    } catch (err) {
      this.logger.error('Failed to index exam', err);
    }
  }
  async deleteDocument(index, id) {
    try {
      await this.es.delete({
        index,
        id
      });
    } catch (err) {
      this.logger.warn(`Failed to delete ${id} from ${index}`, err);
    }
  }
  /** Alias for deleteDocument — used by phase-8a interface contract */
  async deleteFromIndex(indexName, id) {
    return this.deleteDocument(indexName, id);
  }
  /** Alias for createIndices — used by phase-8a interface contract */
  async ensureIndexes() {
    return this.createIndices();
  }
  async checkHealth() {
    try {
      await this.es.ping();
      return {
        status: 'ok',
        ping: true
      };
    } catch {
      return {
        status: 'unavailable',
        ping: false
      };
    }
  }
  // ── Individual searches ───────────────────────────────────────────────────
  async searchCourses(query, tenantId, filters, page = 1, limit = 20) {
    try {
      const must = [{
        multi_match: {
          query,
          fields: ['title^3', 'description', 'tags^2', 'teacherName'],
          fuzziness: 'AUTO'
        }
      }, {
        term: {
          tenantId
        }
      }];
      if (filters?.category) {
        must.push({
          term: {
            category: filters.category
          }
        });
      }
      if (filters?.level) {
        must.push({
          term: {
            level: filters.level
          }
        });
      }
      const result = await this.es.search({
        index: 'courses',
        from: (page - 1) * limit,
        size: limit,
        query: {
          bool: {
            must
          }
        },
        highlight: {
          fields: {
            title: {},
            description: {}
          }
        }
      });
      return {
        hits: result.hits.hits.map(h => ({
          id: h._id,
          score: h._score,
          ...h._source,
          highlights: h.highlight
        })),
        total: typeof result.hits.total === 'number' ? result.hits.total : result.hits.total?.value ?? 0,
        page,
        limit
      };
    } catch {
      return {
        hits: [],
        total: 0,
        page,
        limit
      };
    }
  }
  async searchUsers(query, tenantId, filters, page = 1, limit = 20) {
    try {
      const must = [{
        multi_match: {
          query,
          fields: ['firstName^2', 'lastName^2', 'email'],
          fuzziness: 'AUTO'
        }
      }, {
        term: {
          tenantId
        }
      }];
      if (filters?.role) {
        must.push({
          term: {
            role: filters.role
          }
        });
      }
      const result = await this.es.search({
        index: 'users',
        from: (page - 1) * limit,
        size: limit,
        query: {
          bool: {
            must
          }
        }
      });
      return {
        hits: result.hits.hits.map(h => ({
          id: h._id,
          score: h._score,
          ...h._source
        })),
        total: typeof result.hits.total === 'number' ? result.hits.total : result.hits.total?.value ?? 0,
        page,
        limit
      };
    } catch {
      return {
        hits: [],
        total: 0,
        page,
        limit
      };
    }
  }
  async searchExams(query, tenantId, filters, page = 1, limit = 20) {
    try {
      const must = [{
        multi_match: {
          query,
          fields: ['title^3', 'subject^2', 'topic'],
          fuzziness: 'AUTO'
        }
      }, {
        term: {
          tenantId
        }
      }];
      if (filters?.difficulty) {
        must.push({
          term: {
            difficulty: filters.difficulty
          }
        });
      }
      const result = await this.es.search({
        index: 'exams',
        from: (page - 1) * limit,
        size: limit,
        query: {
          bool: {
            must
          }
        },
        highlight: {
          fields: {
            title: {},
            subject: {}
          }
        }
      });
      return {
        hits: result.hits.hits.map(h => ({
          id: h._id,
          score: h._score,
          ...h._source
        })),
        total: typeof result.hits.total === 'number' ? result.hits.total : result.hits.total?.value ?? 0,
        page,
        limit
      };
    } catch {
      return {
        hits: [],
        total: 0,
        page,
        limit
      };
    }
  }
  // ── Unified search ────────────────────────────────────────────────────────
  async searchAll(query, tenantId, limit = 5) {
    const [courses, users, exams] = await Promise.all([this.searchCourses(query, tenantId, {}, 1, limit), this.searchUsers(query, tenantId, {}, 1, limit), this.searchExams(query, tenantId, {}, 1, limit)]);
    return {
      courses: courses.hits,
      users: users.hits,
      exams: exams.hits,
      totals: {
        courses: courses.total,
        users: users.total,
        exams: exams.total,
        all: courses.total + users.total + exams.total
      }
    };
  }
  // ── Autocomplete suggestions ──────────────────────────────────────────────
  async suggest(query, tenantId) {
    try {
      const [courses, exams] = await Promise.all([this.es.search({
        index: 'courses',
        size: 5,
        query: {
          bool: {
            must: [{
              match_phrase_prefix: {
                title: query
              }
            }, {
              term: {
                tenantId
              }
            }]
          }
        },
        _source: ['title']
      }), this.es.search({
        index: 'exams',
        size: 3,
        query: {
          bool: {
            must: [{
              match_phrase_prefix: {
                title: query
              }
            }, {
              term: {
                tenantId
              }
            }]
          }
        },
        _source: ['title', 'subject']
      })]);
      return [...courses.hits.hits.map(h => ({
        type: 'course',
        id: h._id,
        label: h._source.title
      })), ...exams.hits.hits.map(h => ({
        type: 'exam',
        id: h._id,
        label: h._source.title ?? h._source.subject
      }))];
    } catch {
      return [];
    }
  }
};
exports.SearchService = SearchService = SearchService_1 = __decorate([(0, _common.Injectable)(), __param(0, (0, _common.Inject)(_elasticsearch.ElasticsearchService)), __metadata("design:paramtypes", [Object])], SearchService);