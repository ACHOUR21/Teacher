"use strict";

var _elasticsearch = require("@nestjs/elasticsearch");
var _testing = require("@nestjs/testing");
var _search = require("../search.service");
const mockEs = {
  index: jest.fn(),
  search: jest.fn(),
  delete: jest.fn(),
  indices: {
    exists: jest.fn(),
    create: jest.fn()
  }
};
describe('SearchService', () => {
  let service;
  beforeEach(async () => {
    const module = await _testing.Test.createTestingModule({
      providers: [_search.SearchService, {
        provide: _elasticsearch.ElasticsearchService,
        useValue: mockEs
      }]
    }).compile();
    service = module.get(_search.SearchService);
    jest.clearAllMocks();
  });
  describe('indexCourse', () => {
    it('should index a course document', async () => {
      mockEs.index.mockResolvedValueOnce({});
      await service.indexCourse({
        id: 'c-1',
        title: 'Algebra I',
        description: 'Basic algebra',
        category: 'Mathematics',
        tags: ['math', 'algebra'],
        teacherName: 'Jane Smith',
        tenantId: 'tenant-1'
      });
      expect(mockEs.index).toHaveBeenCalledWith(expect.objectContaining({
        index: 'courses',
        id: 'c-1'
      }));
    });
    it('should silently handle indexing errors', async () => {
      mockEs.index.mockRejectedValueOnce(new Error('ES unavailable'));
      await expect(service.indexCourse({
        id: 'c-1',
        title: 'Test',
        tags: [],
        teacherName: 'T',
        tenantId: 't-1'
      })).resolves.not.toThrow();
    });
  });
  describe('searchCourses', () => {
    it('should return search hits with pagination info', async () => {
      mockEs.search.mockResolvedValueOnce({
        hits: {
          hits: [{
            _id: 'c-1',
            _score: 1.5,
            _source: {
              title: 'Algebra I',
              tenantId: 'tenant-1'
            },
            highlight: {
              title: ['<em>Algebra</em>']
            }
          }],
          total: {
            value: 1
          }
        }
      });
      const result = await service.searchCourses('algebra', 'tenant-1');
      expect(result.hits).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.hits[0].id).toBe('c-1');
    });
    it('should return empty results on search error', async () => {
      mockEs.search.mockRejectedValueOnce(new Error('Search timeout'));
      const result = await service.searchCourses('test', 'tenant-1');
      expect(result.hits).toHaveLength(0);
      expect(result.total).toBe(0);
    });
    it('should apply category filter', async () => {
      mockEs.search.mockResolvedValueOnce({
        hits: {
          hits: [],
          total: {
            value: 0
          }
        }
      });
      await service.searchCourses('math', 'tenant-1', {
        category: 'Mathematics'
      });
      expect(mockEs.search).toHaveBeenCalledWith(expect.objectContaining({
        query: expect.objectContaining({
          bool: expect.objectContaining({
            must: expect.arrayContaining([expect.objectContaining({
              term: {
                category: 'Mathematics'
              }
            })])
          })
        })
      }));
    });
  });
  describe('deleteDocument', () => {
    it('should delete a document by index and id', async () => {
      mockEs.delete.mockResolvedValueOnce({});
      await service.deleteDocument('courses', 'c-1');
      expect(mockEs.delete).toHaveBeenCalledWith({
        index: 'courses',
        id: 'c-1'
      });
    });
    it('should silently handle deletion errors', async () => {
      mockEs.delete.mockRejectedValueOnce(new Error('Not found'));
      await expect(service.deleteDocument('courses', 'missing')).resolves.not.toThrow();
    });
  });
  describe('createIndices', () => {
    it('should create index if it does not exist', async () => {
      mockEs.indices.exists.mockResolvedValueOnce(false);
      mockEs.indices.create.mockResolvedValueOnce({});
      await service.createIndices();
      expect(mockEs.indices.create).toHaveBeenCalledWith(expect.objectContaining({
        index: 'courses'
      }));
    });
    it('should skip creation if index already exists', async () => {
      // service checks both 'courses' and 'users' indices
      mockEs.indices.exists.mockResolvedValue(true);
      await service.createIndices();
      expect(mockEs.indices.create).not.toHaveBeenCalled();
    });
  });
});