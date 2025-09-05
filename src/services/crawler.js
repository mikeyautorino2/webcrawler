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

      const startTime = Date.now();
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

      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // Calculate content size
      const contentLength = response.headers['content-length'] ? 
        parseInt(response.headers['content-length']) : 
        Buffer.byteLength(response.data, 'utf8');

      const performanceMetrics = {
        response_time_ms: responseTime,
        content_size_bytes: contentLength,
        status_code: response.status,
        redirect_count: response.request?.res?.redirects?.length || 0
      };

      const html = response.data;
      return this.parseHtml(html, normalizedUrl, performanceMetrics);
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
   * @param {Object} performanceMetrics - Performance metrics from the request
   * @returns {Object} The extracted data
   */
  parseHtml(html, url, performanceMetrics = {}) {
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
    
    // Extract social media meta tags
    const socialMeta = this.extractSocialMeta($);
    
    // Perform SEO analysis
    const seoAnalysis = this.analyzeSEO($, title, description);
    
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
        social_meta: socialMeta,
        seo_analysis: seoAnalysis,
        performance_metrics: performanceMetrics,
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
        social_meta: { openGraph: {}, twitter: {}, other: {} },
        seo_analysis: { score: 0, issues: ['Failed to analyze page'], recommendations: [] },
        performance_metrics: performanceMetrics,
        headings: { h1: [], h2: [], h3: [] },
        link_counts: { internal: 0, external: 0, total: 0 },
        images: [],
        word_count: 0,
      };
    }
  }

  /**
   * Extract social media meta tags (Open Graph, Twitter Cards, etc.)
   * @param {Object} $ - Cheerio instance
   * @returns {Object} Object containing social media metadata
   */
  extractSocialMeta($) {
    const socialMeta = {
      openGraph: {},
      twitter: {},
      other: {}
    };

    // Extract Open Graph tags
    $('meta[property^="og:"]').each((_, el) => {
      const property = $(el).attr('property');
      const content = $(el).attr('content');
      if (property && content) {
        const key = property.replace('og:', '');
        socialMeta.openGraph[key] = content;
      }
    });

    // Extract Twitter Card tags
    $('meta[name^="twitter:"]').each((_, el) => {
      const name = $(el).attr('name');
      const content = $(el).attr('content');
      if (name && content) {
        const key = name.replace('twitter:', '');
        socialMeta.twitter[key] = content;
      }
    });

    // Extract other common social/SEO meta tags
    const otherMetaTags = [
      'author', 'keywords', 'robots', 'viewport', 
      'theme-color', 'application-name', 'generator',
      'article:author', 'article:section', 'article:published_time'
    ];

    otherMetaTags.forEach(tag => {
      let content = $(`meta[name="${tag}"]`).attr('content') || 
                   $(`meta[property="${tag}"]`).attr('content');
      if (content) {
        socialMeta.other[tag] = content;
      }
    });

    // Extract canonical URL
    const canonical = $('link[rel="canonical"]').attr('href');
    if (canonical) {
      socialMeta.other.canonical = canonical;
    }

    return socialMeta;
  }

  /**
   * Analyze SEO factors and provide recommendations
   * @param {Object} $ - Cheerio instance
   * @param {string} title - Page title
   * @param {string} description - Meta description
   * @returns {Object} SEO analysis results
   */
  analyzeSEO($, title, description) {
    const analysis = {
      score: 100,
      issues: [],
      recommendations: [],
      details: {}
    };

    // Title analysis
    if (!title || title.trim() === '') {
      analysis.issues.push('Missing page title');
      analysis.recommendations.push('Add a descriptive title tag');
      analysis.score -= 20;
    } else {
      if (title.length < 30) {
        analysis.issues.push('Title too short (< 30 characters)');
        analysis.recommendations.push('Expand title to 30-60 characters for better SEO');
        analysis.score -= 10;
      } else if (title.length > 60) {
        analysis.issues.push('Title too long (> 60 characters)');
        analysis.recommendations.push('Shorten title to under 60 characters');
        analysis.score -= 5;
      }
    }

    // Meta description analysis
    if (!description || description.trim() === '') {
      analysis.issues.push('Missing meta description');
      analysis.recommendations.push('Add a meta description (150-160 characters)');
      analysis.score -= 15;
    } else {
      if (description.length < 120) {
        analysis.issues.push('Meta description too short (< 120 characters)');
        analysis.recommendations.push('Expand meta description to 120-160 characters');
        analysis.score -= 8;
      } else if (description.length > 160) {
        analysis.issues.push('Meta description too long (> 160 characters)');
        analysis.recommendations.push('Shorten meta description to under 160 characters');
        analysis.score -= 5;
      }
    }

    // Heading structure analysis
    const h1Count = $('h1').length;
    const h2Count = $('h2').length;
    const h3Count = $('h3').length;
    
    if (h1Count === 0) {
      analysis.issues.push('Missing H1 heading');
      analysis.recommendations.push('Add an H1 heading to define page topic');
      analysis.score -= 15;
    } else if (h1Count > 1) {
      analysis.issues.push('Multiple H1 headings found');
      analysis.recommendations.push('Use only one H1 heading per page');
      analysis.score -= 5;
    }

    // Alt text analysis
    const imagesWithoutAlt = $('img:not([alt])').length;
    const totalImages = $('img').length;
    if (imagesWithoutAlt > 0) {
      analysis.issues.push(`${imagesWithoutAlt} images missing alt text`);
      analysis.recommendations.push('Add descriptive alt text to all images for accessibility');
      analysis.score -= Math.min(imagesWithoutAlt * 3, 15);
    }

    // Internal linking
    const internalLinks = $('a[href^="/"], a[href^="./"], a[href^="../"]').length;
    if (internalLinks === 0) {
      analysis.issues.push('No internal links found');
      analysis.recommendations.push('Add internal links to improve navigation and SEO');
      analysis.score -= 8;
    }

    // Schema markup check
    const hasSchema = $('script[type="application/ld+json"]').length > 0 || 
                     $('[itemscope]').length > 0;
    if (!hasSchema) {
      analysis.recommendations.push('Consider adding structured data (Schema.org) markup');
    }

    // Language declaration
    if (!$('html[lang]').length) {
      analysis.issues.push('Missing language declaration');
      analysis.recommendations.push('Add lang attribute to html element');
      analysis.score -= 3;
    }

    // Details for frontend display
    analysis.details = {
      title_length: title ? title.length : 0,
      description_length: description ? description.length : 0,
      h1_count: h1Count,
      h2_count: h2Count,
      h3_count: h3Count,
      images_without_alt: imagesWithoutAlt,
      total_images: totalImages,
      internal_links: internalLinks,
      has_schema: hasSchema,
      has_lang_attr: $('html[lang]').length > 0
    };

    // Ensure score doesn't go below 0
    analysis.score = Math.max(0, analysis.score);

    return analysis;
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
