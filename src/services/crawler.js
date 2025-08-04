const axios = require('axios');
const cheerio = require('cheerio');
const logger = require('../config/logger');
const { isValidUrl, normalizeUrl } = require('../utils/url');

class CrawlerService {
  /**
   * Crawl a URL and extract page data
   * @param {string} url - The URL to analyze
   * @returns {Promise<Object>} The extracted page data
   */
  async crawlUrl(url) {
    try {
      if (!isValidUrl(url)) {
        throw new Error('Invalid URL format');
      }

      const normalizedUrl = normalizeUrl(url);
      logger.info('Starting crawl', { url: normalizedUrl });

      const response = await axios.get(normalizedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
        timeout: 30000, // 30 second timeout
        maxContentLength: 1024 * 1024 * 10, // 10MB max response size
        maxRedirects: 5, // Allow up to 5 redirects
        validateStatus: function (status) {
          return status >= 200 && status < 400; // Accept 2xx and 3xx status codes
        },
        // Handle HTTPS certificate issues in development
        httpsAgent: process.env.NODE_ENV === 'development' ? 
          new (require('https').Agent)({ rejectUnauthorized: false }) : undefined,
      });

      const html = response.data;
      return this.parseHtml(html, normalizedUrl);
    } catch (error) {
      // Enhanced error logging and handling
      const errorDetails = {
        url,
        error: error.message,
        code: error.code,
        status: error.response?.status,
        statusText: error.response?.statusText,
        headers: error.response?.headers,
        timeout: error.code === 'ECONNABORTED',
        network: error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED',
      };
      
      logger.error('Error crawling URL', errorDetails);
      
      // Create more specific error messages
      if (error.code === 'ECONNABORTED') {
        const timeoutError = new Error('Request timeout - website took too long to respond');
        timeoutError.code = 'ETIMEDOUT';
        throw timeoutError;
      }
      
      if (error.code === 'ENOTFOUND') {
        const notFoundError = new Error('Website not found - please check the URL');
        notFoundError.code = 'ENOTFOUND';
        throw notFoundError;
      }
      
      if (error.code === 'ECONNREFUSED') {
        const connRefusedError = new Error('Connection refused - website is not accessible');
        connRefusedError.code = 'ECONNREFUSED';
        throw connRefusedError;
      }
      
      // Handle HTTP status errors
      if (error.response && error.response.status) {
        error.response.data = { error: `HTTP ${error.response.status}: ${error.response.statusText}` };
      }
      
      throw error;
    }
  }

  /**
   * Parse HTML content and extract data
   * @param {string} html - The HTML content
   * @param {string} url - The URL of the page
   * @returns {Object} The extracted data
   */
  parseHtml(html, url) {
    try {
      // Validate HTML content
      if (!html || typeof html !== 'string') {
        throw new Error('Invalid HTML content received');
      }
      
      if (html.length === 0) {
        throw new Error('Empty HTML content received');
      }
      
      const $ = cheerio.load(html);
      const baseUrl = new URL(url);
    
    // Extract title
    const title = $('title').text().trim();
    
    // Extract meta description
    const description = $('meta[name="description"]').attr('content') || '';
    
    // Extract headings
    const headings = {
      h1: $('h1').map((i, el) => $(el).text().trim()).get(),
      h2: $('h2').map((i, el) => $(el).text().trim()).get(),
      h3: $('h3').map((i, el) => $(el).text().trim()).get(),
    };
    
    // Extract and categorize links
    const allLinks = $('a[href]').map((i, el) => $(el).attr('href')).get();
    const { internal, external } = this.categorizeLinksByDomain(allLinks, baseUrl);
    
    // Extract images
    const images = $('img[src]')
      .map((i, el) => $(el).attr('src'))
      .get()
      .filter(src => src && !src.startsWith('data:'))
      .map(src => this.resolveImageUrl(src, baseUrl.href));
    
    // Count words
    const bodyText = $('body').text();
    const wordCount = this.countWords(bodyText);
    
    logger.info('Completed parsing HTML', { 
      url,
      stats: {
        headings: {
          h1: headings.h1.length,
          h2: headings.h2.length,
          h3: headings.h3.length,
        },
        links: {
          internal: internal.length,
          external: external.length,
        },
        images: images.length,
        wordCount,
      }
    });
    
      return {
        url,
        title: title || 'No title found',
        description: description || '',
        headings,
        link_counts: {
          internal: internal.length,
          external: external.length,
          total: allLinks.length,
        },
        images,
        word_count: wordCount,
      };
    } catch (parseError) {
      logger.error('Error parsing HTML', {
        url,
        error: parseError.message,
        htmlLength: html?.length || 0,
      });
      
      // Return minimal data structure on parse error
      return {
        url,
        title: 'Error parsing page',
        description: `Failed to parse HTML: ${parseError.message}`,
        headings: { h1: [], h2: [], h3: [] },
        link_counts: { internal: 0, external: 0, total: 0 },
        images: [],
        word_count: 0,
      };
    }
  }

  /**
   * Categorize links as internal or external
   * @param {string[]} links - Array of href values
   * @param {URL} baseUrl - URL object for the base domain
   * @returns {Object} Object with internal and external link arrays
   */
  categorizeLinksByDomain(links, baseUrl) {
    const internal = new Set();
    const external = new Set();
    
    const skipPatterns = new Set(['#', 'javascript:', 'mailto:', 'tel:']);
    
    for (const link of links) {
      if (!link || [...skipPatterns].some(pattern => link.startsWith(pattern))) {
        continue;
      }
      
      try {
        const isRelative = /^\.{0,2}\//.test(link);
        if (isRelative || link.includes(baseUrl.hostname)) {
          internal.add(link);
        } else {
          new URL(link); // Validate URL
          external.add(link);
        }
      } catch (e) {
        internal.add(link);
      }
    }
    
    return {
      internal: [...internal],
      external: [...external]
    };
  }

  /**
   * Count words in text
   * @param {string} text - The text to analyze
   * @returns {number} Word count
   */
  countWords(text) {
    // Remove extra whitespace and split by spaces
    return text
      .replace(/\s+/g, ' ')
      .split(' ')
      .filter(Boolean)
      .length;
  }

  /**
   * Resolve relative image URLs to absolute URLs
   * @param {string} src - The image source attribute
   * @param {string} baseUrl - The base URL of the page
   * @returns {string} The absolute URL
   */
  resolveImageUrl(src, baseUrl) {
    try {
      return new URL(src, baseUrl).href;
    } catch (e) {
      return src; // Return original if cannot be resolved
    }
  }
}

module.exports = new CrawlerService();
