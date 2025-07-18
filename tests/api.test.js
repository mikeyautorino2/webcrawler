const request = require('supertest');
const { app, initializeDatabase } = require('../src/app');
const AnalysisModel = require('../src/models/analysis');

// Mock the database and crawler service
jest.mock('../src/models/analysis');
jest.mock('../src/services/crawler');
jest.mock('../src/config/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}));

const mockAnalysisData = {
  id: 1,
  url: 'https://example.com',
  title: 'Example Domain',
  description: 'This is a test description',
  headings: { h1: ['Example Domain'], h2: [], h3: [] },
  link_counts: { internal: 0, external: 1 },
  images: [],
  word_count: 25,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

describe('API Endpoints', () => {
  beforeAll(async () => {
    await initializeDatabase();
  });

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  describe('GET /api/analyze', () => {
    it('should return analysis history', async () => {
      AnalysisModel.getAll.mockResolvedValue([mockAnalysisData]);

      const response = await request(app).get('/api/analyze');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBe(1);
      expect(response.body[0].url).toBe(mockAnalysisData.url);
    });
  });

  describe('GET /api/analyze/:id', () => {
    it('should return a specific analysis', async () => {
      AnalysisModel.findById.mockResolvedValue(mockAnalysisData);

      const response = await request(app).get('/api/analyze/1');

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(mockAnalysisData.id);
      expect(response.body.url).toBe(mockAnalysisData.url);
    });

    it('should return 404 for non-existent analysis', async () => {
      AnalysisModel.findById.mockResolvedValue(null);

      const response = await request(app).get('/api/analyze/999');

      expect(response.status).toBe(404);
    });
  });
});
