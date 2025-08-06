// API utility to handle both development and production environments
import axios from 'axios';

// Create base URL based on environment with multiple detection methods
const isProduction = process.env.NODE_ENV === 'production' || 
                    window.location.hostname !== 'localhost' ||
                    window.location.hostname.includes('vercel.app');

const baseURL = isProduction
  ? '/api' // In production, API routes are under /api path on the same domain
  : 'http://localhost:9999/api'; // In development, connect directly to backend

// Debug logging to help identify environment issues
console.log('API Configuration:', {
  NODE_ENV: process.env.NODE_ENV,
  hostname: window.location.hostname,
  isProduction,
  baseURL
});

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor
api.interceptors.request.use(
  config => {
    // You could add authentication tokens here if needed
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    const errorResponse = {
      message: 'An unexpected error occurred',
      status: 500,
      data: null
    };
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      errorResponse.message = error.response.data.error || error.response.data.message || 'Server error';
      errorResponse.status = error.response.status;
      errorResponse.data = error.response.data;
      
      // Log specific error for different status codes
      if (error.response.status === 404) {
        console.error('API endpoint not found. This might indicate a deployment issue.', {
          requestedURL: error.config?.url,
          baseURL: error.config?.baseURL,
          fullURL: error.config?.baseURL + error.config?.url,
          hostname: window.location.hostname,
          isProduction
        });
        errorResponse.message = 'API endpoint not found. Please try again or contact support.';
      } else if (error.response.status === 0) {
        errorResponse.message = 'Network error. Please check your connection.';
      } else if (error.response.status >= 500) {
        errorResponse.message = 'Server error. Please try again later.';
      }
      
      console.error('API Error Response:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        fullURL: error.config?.baseURL + error.config?.url,
        environment: { NODE_ENV: process.env.NODE_ENV, hostname: window.location.hostname, isProduction }
      });
    } else if (error.request) {
      // The request was made but no response was received
      errorResponse.message = 'No response from server. Please check your connection.';
      errorResponse.status = 0;
      console.error('API Network Error:', {
        request: error.request,
        config: error.config,
        requestURL: error.config?.url,
        baseURL: error.config?.baseURL,
        fullURL: error.config?.baseURL + error.config?.url,
        environment: { NODE_ENV: process.env.NODE_ENV, hostname: window.location.hostname, isProduction }
      });
    } else {
      // Something happened in setting up the request that triggered an error
      console.error('API Setup Error:', error.message);
      errorResponse.message = error.message || 'Request setup error';
    }
    
    return Promise.reject(errorResponse);
  }
);

export default api;
