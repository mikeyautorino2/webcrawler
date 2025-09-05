const request = require('supertest');
const { app } = require('../src/app');
const CrawlerService = require('../src/services/crawler');

// Mock the crawler service and logger
jest.mock('../src/services/crawler');
jest.mock('../src/config/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}));

const mockAnalysisData = {
  url: 'https://example.com',
  title: 'Example Domain',
  description: 'This is a test description',
  social_meta: { 
    openGraph: { title: 'Test OG Title', description: 'Test OG Description' }, 
    twitter: { card: 'summary' }, 
    other: {} 
  },
  seo_analysis: {
    score: 85,
    issues: ['Title too short'],
    recommendations: ['Expand title to 30-60 characters'],
    details: { 
      title_length: 25, 
      h1_count: 1,
      images_without_alt: 0,
      has_schema: false
    }
  },
  performance_metrics: {
    response_time_ms: 500,
    content_size_bytes: 1024,
    status_code: 200,
    redirect_count: 0
  },
  headings: { h1: ['Example Domain'], h2: [], h3: [] },
  link_counts: { internal: 0, external: 1, total: 1 },
  images: [],
  word_count: 25
};

describe('API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/analyze', () => {
    it('should analyze a valid URL', async () => {
      CrawlerService.crawlUrl.mockResolvedValue(mockAnalysisData);

      const response = await request(app)
        .post('/api/analyze')
        .send({ url: 'https://example.com' });

      expect(response.status).toBe(200);
      expect(response.body.url).toBe(mockAnalysisData.url);
      expect(response.body.title).toBe(mockAnalysisData.title);
      expect(response.body.social_meta).toBeDefined();
      expect(response.body.seo_analysis).toBeDefined();
      expect(response.body.performance_metrics).toBeDefined();
    });

    it('should return 400 for missing URL', async () => {
      const response = await request(app)
        .post('/api/analyze')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('URL is required');
    });

    it('should handle crawler errors', async () => {
      const error = new Error('Invalid URL format');
      CrawlerService.crawlUrl.mockRejectedValue(error);

      const response = await request(app)
        .post('/api/analyze')
        .send({ url: 'invalid-url' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid URL format');
    });
  });

  describe('POST /api/analyze/bulk', () => {
    it('should analyze multiple URLs', async () => {
      CrawlerService.crawlUrl.mockResolvedValue(mockAnalysisData);

      const response = await request(app)
        .post('/api/analyze/bulk')
        .send({ 
          urls: ['https://example.com', 'https://test.com'],
          maxConcurrent: 2
        });

      expect(response.status).toBe(200);
      expect(response.body.results).toBeDefined();
      expect(response.body.summary).toBeDefined();
      expect(response.body.summary.total).toBe(2);
    });

    it('should return 400 for missing URLs array', async () => {
      const response = await request(app)
        .post('/api/analyze/bulk')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('URLs array is required');
    });

    it('should limit bulk analysis to 50 URLs', async () => {
      const urls = Array(51).fill('https://example.com');
      
      const response = await request(app)
        .post('/api/analyze/bulk')
        .send({ urls });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Maximum 50 URLs allowed per bulk analysis');
    });
  });

  describe('POST /api/analyze/export', () => {
    it('should export analysis data as JSON', async () => {
      const response = await request(app)
        .post('/api/analyze/export')
        .send({ 
          data: [mockAnalysisData]
        });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('application/json');
      expect(response.headers['content-disposition']).toContain('attachment');
    });

    it('should return 400 for missing data', async () => {
      const response = await request(app)
        .post('/api/analyze/export')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Analysis data is required');
    });
  });
});
