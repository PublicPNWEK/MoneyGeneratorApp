/**
 * Netlify Function: API Proxy for Money Generator App V2 API
 * Handles routing, caching, error handling, and request logging
 */

const http = require('http');
const https = require('https');

// Configuration
const API_BASE_URL = process.env.VITE_API_URL || 'https://api.moneygenerator.app';
const CACHE_CONTROL_MAP = {
  'GET /api/v2/referrals': 'max-age=300, stale-while-revalidate=600',
  'GET /api/v2/subscriptions': 'max-age=600, stale-while-revalidate=1800',
  'GET /api/v2/reports': 'max-age=900, stale-while-revalidate=3600',
  'POST /api/v2': 'no-cache',
  'PUT /api/v2': 'no-cache',
  'DELETE /api/v2': 'no-cache',
};

// Response cache (simple in-memory, replace with Redis in production)
const responseCache = new Map();

exports.handler = async (event, context) => {
  try {
    const { httpMethod, path, body, headers } = event;
    const cacheKey = `${httpMethod}:${path}`;

    // Log request
    console.log(`[API Proxy] ${httpMethod} ${path}`);

    // Check cache for GET requests
    if (httpMethod === 'GET' && responseCache.has(cacheKey)) {
      const cached = responseCache.get(cacheKey);
      if (Date.now() - cached.timestamp < 300000) { // 5 min cache
        console.log(`[API Proxy] Cache hit for ${cacheKey}`);
        return {
          statusCode: cached.statusCode,
          headers: {
            ...cached.headers,
            'X-Cache': 'HIT',
            'X-Cached-At': new Date(cached.timestamp).toISOString(),
          },
          body: cached.body,
        };
      }
    }

    // Determine target URL
    const targetPath = path.replace(/^\/api\/v2/, '/api/v2');
    const targetUrl = `${API_BASE_URL}${targetPath}${event.rawQuery ? `?${event.rawQuery}` : ''}`;

    console.log(`[API Proxy] Forwarding to: ${targetUrl}`);

    // Make request to backend
    const response = await makeRequest(httpMethod, targetUrl, headers, body);

    // Cache successful GET responses
    if (httpMethod === 'GET' && response.statusCode >= 200 && response.statusCode < 300) {
      responseCache.set(cacheKey, {
        statusCode: response.statusCode,
        headers: response.headers,
        body: response.body,
        timestamp: Date.now(),
      });

      // Clean up old cache entries (every 100 requests)
      if (Math.random() < 0.01) {
        const now = Date.now();
        for (const [key, value] of responseCache.entries()) {
          if (now - value.timestamp > 3600000) { // 1 hour
            responseCache.delete(key);
          }
        }
      }
    }

    // Determine cache control header
    const cacheControl = getCacheControl(httpMethod, path);

    return {
      statusCode: response.statusCode,
      headers: {
        ...response.headers,
        'Cache-Control': cacheControl,
        'X-Cache': 'MISS',
        'Access-Control-Allow-Origin': headers.origin || '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-User-ID',
      },
      body: response.body,
    };
  } catch (error) {
    console.error('[API Proxy] Error:', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: 'API Proxy Error',
        message: error.message,
        timestamp: new Date().toISOString(),
      }),
    };
  }
};

/**
 * Make HTTP/HTTPS request
 */
function makeRequest(method, urlString, headers, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlString);
    const client = url.protocol === 'https:' ? https : http;

    // Filter headers
    const filteredHeaders = filterHeaders(headers);
    filteredHeaders['User-Agent'] = 'Money-Generator-API-Proxy/1.0';

    const options = {
      method,
      headers: filteredHeaders,
      timeout: 30000, // 30 second timeout
    };

    const req = client.request(url, options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: filterResponseHeaders(res.headers),
          body: data,
        });
      });
    });

    req.on('error', (error) => {
      console.error('[API Proxy] Request error:', error.message);
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (body) {
      req.write(body);
    }

    req.end();
  });
}

/**
 * Filter headers for forwarding
 */
function filterHeaders(headers) {
  const allowed = [
    'content-type',
    'authorization',
    'x-user-id',
    'x-request-id',
    'accept',
    'accept-encoding',
  ];

  const filtered = {};
  for (const [key, value] of Object.entries(headers)) {
    if (allowed.includes(key.toLowerCase())) {
      filtered[key] = value;
    }
  }
  return filtered;
}

/**
 * Filter response headers
 */
function filterResponseHeaders(headers) {
  const blocked = [
    'connection',
    'transfer-encoding',
    'content-encoding',
    'set-cookie',
  ];

  const filtered = {};
  for (const [key, value] of Object.entries(headers)) {
    if (!blocked.includes(key.toLowerCase())) {
      filtered[key] = value;
    }
  }
  return filtered;
}

/**
 * Determine cache control header
 */
function getCacheControl(method, path) {
  for (const [pattern, cacheControl] of Object.entries(CACHE_CONTROL_MAP)) {
    if (path.match(pattern)) {
      return cacheControl;
    }
  }

  // Default cache control
  if (method === 'GET') {
    return 'public, max-age=300, stale-while-revalidate=600';
  }
  return 'no-cache, no-store, must-revalidate';
}
