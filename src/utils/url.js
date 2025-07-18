/**
 * Check if a string is a valid URL
 * @param {string} url - The URL to validate
 * @returns {boolean} Whether the URL is valid
 */
function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch (e) {
    // Try adding https:// prefix and validate again
    try {
      new URL(`https://${url}`);
      return true;
    } catch (e) {
      return false;
    }
  }
}

/**
 * Normalize a URL by ensuring it has a protocol
 * @param {string} url - The URL to normalize
 * @returns {string} The normalized URL
 */
function normalizeUrl(url) {
  try {
    new URL(url);
    return url;
  } catch (e) {
    // If parsing fails, try adding https://
    return `https://${url}`;
  }
}

module.exports = {
  isValidUrl,
  normalizeUrl
};
