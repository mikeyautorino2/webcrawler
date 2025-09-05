/**
 * Utility functions for exporting analysis data
 */

/**
 * Download analysis data as JSON file
 * @param {Object} analysisData - The analysis data to export
 * @param {string} filename - Optional custom filename
 */
export const downloadAsJson = (analysisData, filename) => {
  try {
    // Create a clean copy of the data without React-specific properties
    const exportData = {
      url: analysisData.url,
      title: analysisData.title,
      description: analysisData.description,
      created_at: analysisData.created_at,
      social_meta: analysisData.social_meta,
      seo_analysis: analysisData.seo_analysis,
      performance_metrics: analysisData.performance_metrics,
      headings: analysisData.headings,
      link_counts: analysisData.link_counts,
      images: analysisData.images,
      word_count: analysisData.word_count
    };

    // Convert to JSON string with formatting
    const jsonString = JSON.stringify(exportData, null, 2);
    
    // Create blob and download link
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Generate filename if not provided
    const defaultFilename = `analysis-${analysisData.url.replace(/https?:\/\//, '').replace(/[^a-z0-9]/gi, '_')}-${new Date().toISOString().slice(0, 10)}.json`;
    const finalFilename = filename || defaultFilename;
    
    // Create and trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = finalFilename;
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Error exporting JSON:', error);
    return false;
  }
};

/**
 * Format analysis data for display in export preview
 * @param {Object} analysisData - The analysis data
 * @returns {string} Formatted summary
 */
export const getExportSummary = (analysisData) => {
  const stats = [
    `URL: ${analysisData.url}`,
    `Title: ${analysisData.title || 'N/A'}`,
    `Word Count: ${analysisData.word_count || 0}`,
    `Total Links: ${analysisData.link_counts?.total || 0}`,
    `Images: ${analysisData.images?.length || 0}`,
    `SEO Score: ${analysisData.seo_analysis?.score || 0}/100`
  ];
  
  return stats.join('\n');
};