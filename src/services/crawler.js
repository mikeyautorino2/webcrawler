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
          'User-Agent': 'LinkAnalyzer Bot/1.0 (https://linkanalyzer.example.com)',
        },
        timeout: 10000, // 10 second timeout
        maxContentLength: 1024 * 1024 * 5, // 5MB max response size
      });

      const html = response.data;
      return this.parseHtml(html, normalizedUrl);
    } catch (error) {
      logger.error('Error crawling URL', { 
        url, 
        error: error.message,
        status: error.response?.status,
      });
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
      title,
      description,
      headings,
      link_counts: {
        internal: internal.length,
        external: external.length,
        total: allLinks.length,
      },
      images,
      word_count: wordCount,
    };
  }

  /**
   * Categorize links as internal or external
   * @param {string[]} links - Array of href values
   * @param {URL} baseUrl - URL object for the base domain
   * @returns {Object} Object with internal and external link arrays
   */
  categorizeLinksByDomain(links, baseUrl) {
    const internal = [];
    const external = [];
    
    links.forEach(link => {
      if (!link) return;
      
      // Skip anchor links, javascript, and mailto
      if (link.startsWith('#') || 
          link.startsWith('javascript:') || 
          link.startsWith('mailto:') ||
          link.startsWith('tel:')) {
        return;
      }
      
      try {
        // If it's a relative URL or has the same hostname, it's internal
        if (link.startsWith('/') || 
            link.startsWith('./') || 
            link.startsWith('../') ||
            link.includes(baseUrl.hostname)) {
          internal.push(link);
        } else {
          // Try to parse it as a URL to validate
          new URL(link);
          external.push(link);
        }
      } catch (e) {
        // If we can't parse it as a URL, assume it's a relative link
        internal.push(link);
      }
    });
    
    return { internal, external };
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
