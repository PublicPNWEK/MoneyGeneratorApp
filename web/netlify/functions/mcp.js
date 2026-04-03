/**
 * Netlify Function: OneCommerce MCP Server
 * Model Context Protocol endpoint for Money Generator App
 *
 * Implements MCP JSON-RPC 2.0 over HTTP with SSE support.
 * Exposes tools for subscriptions, referrals, reports, and jobs.
 */

const SERVER_INFO = {
  name: 'onecommerce-moneygenerator',
  version: '1.0.0',
};

const PROTOCOL_VERSION = '2025-03-26';

// ---------------------------------------------------------------------------
// Tool definitions
// ---------------------------------------------------------------------------

const TOOLS = [
  {
    name: 'list_subscriptions',
    description:
      'List available subscription plans (Basic, Pro, Enterprise) with pricing, features, and billing details.',
    inputSchema: {
      type: 'object',
      properties: {
        tier: {
          type: 'string',
          enum: ['basic', 'pro', 'enterprise'],
          description: 'Filter by subscription tier',
        },
      },
    },
  },
  {
    name: 'get_subscription_status',
    description:
      'Get the current subscription status for a user, including plan tier, billing cycle, renewal date, and active features.',
    inputSchema: {
      type: 'object',
      properties: {
        user_id: { type: 'string', description: 'The user ID to look up' },
      },
      required: ['user_id'],
    },
  },
  {
    name: 'get_referral_stats',
    description:
      'Get referral statistics for a user including referral code, total referrals, conversions by channel, credits earned, and leaderboard position.',
    inputSchema: {
      type: 'object',
      properties: {
        user_id: { type: 'string', description: 'The user ID to look up' },
      },
      required: ['user_id'],
    },
  },
  {
    name: 'generate_report',
    description:
      'Generate a financial report with transaction breakdowns, category spending, and trend analysis for a given date range.',
    inputSchema: {
      type: 'object',
      properties: {
        user_id: { type: 'string', description: 'The user ID' },
        period: {
          type: 'string',
          enum: ['daily', 'weekly', 'monthly', 'yearly'],
          description: 'Report period granularity',
        },
        start_date: {
          type: 'string',
          description: 'Start date in YYYY-MM-DD format',
        },
        end_date: {
          type: 'string',
          description: 'End date in YYYY-MM-DD format',
        },
        format: {
          type: 'string',
          enum: ['json', 'csv', 'pdf'],
          description: 'Output format (default: json)',
        },
      },
      required: ['user_id', 'period'],
    },
  },
  {
    name: 'search_jobs',
    description:
      'Search available gig jobs and marketplace listings with optional filters for location, category, and pay range.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        category: {
          type: 'string',
          description: 'Job category filter',
        },
        min_pay: {
          type: 'number',
          description: 'Minimum pay amount',
        },
        max_pay: {
          type: 'number',
          description: 'Maximum pay amount',
        },
        location: {
          type: 'string',
          description: 'Location filter (city or zip code)',
        },
        limit: {
          type: 'number',
          description: 'Max results to return (default: 10)',
        },
      },
    },
  },
  {
    name: 'get_mileage_summary',
    description:
      'Get mileage tracking summary for tax deductions, including total miles, deductible miles, and estimated deduction value.',
    inputSchema: {
      type: 'object',
      properties: {
        user_id: { type: 'string', description: 'The user ID' },
        tax_year: {
          type: 'number',
          description: 'Tax year (default: current year)',
        },
      },
      required: ['user_id'],
    },
  },
];

// ---------------------------------------------------------------------------
// Tool handlers – call the backend API and return results
// ---------------------------------------------------------------------------

const API_BASE =
  process.env.VITE_API_URL || 'https://api.moneygenerator.app';

async function callApi(path, options = {}) {
  const url = `${API_BASE}${path}`;
  try {
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'OneCommerce-MCP/1.0',
        ...(options.headers || {}),
      },
      ...options,
    });
    if (!res.ok) {
      return { error: `API returned ${res.status}: ${res.statusText}` };
    }
    return await res.json();
  } catch (err) {
    return { error: `API request failed: ${err.message}` };
  }
}

const TOOL_HANDLERS = {
  async list_subscriptions({ tier }) {
    const query = tier ? `?tier=${tier}` : '';
    return callApi(`/api/v2/subscriptions/plans${query}`);
  },

  async get_subscription_status({ user_id }) {
    return callApi(`/api/v2/subscriptions/status`, {
      headers: { 'X-User-ID': user_id },
    });
  },

  async get_referral_stats({ user_id }) {
    return callApi(`/api/v2/referrals/stats`, {
      headers: { 'X-User-ID': user_id },
    });
  },

  async generate_report({ user_id, period, start_date, end_date, format }) {
    const params = new URLSearchParams({ period });
    if (start_date) params.set('start_date', start_date);
    if (end_date) params.set('end_date', end_date);
    if (format) params.set('format', format);
    return callApi(`/api/v2/reports?${params}`, {
      headers: { 'X-User-ID': user_id },
    });
  },

  async search_jobs({ query, category, min_pay, max_pay, location, limit }) {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (category) params.set('category', category);
    if (min_pay != null) params.set('min_pay', String(min_pay));
    if (max_pay != null) params.set('max_pay', String(max_pay));
    if (location) params.set('location', location);
    if (limit != null) params.set('limit', String(limit));
    return callApi(`/api/v2/jobs?${params}`);
  },

  async get_mileage_summary({ user_id, tax_year }) {
    const year = tax_year || new Date().getFullYear();
    return callApi(`/api/v2/mileage/summary?year=${year}`, {
      headers: { 'X-User-ID': user_id },
    });
  },
};

// ---------------------------------------------------------------------------
// JSON-RPC handling
// ---------------------------------------------------------------------------

function jsonRpcResponse(id, result) {
  return { jsonrpc: '2.0', id, result };
}

function jsonRpcError(id, code, message) {
  return { jsonrpc: '2.0', id, error: { code, message } };
}

async function handleRpcRequest(req) {
  const { id, method, params } = req;

  switch (method) {
    case 'initialize':
      return jsonRpcResponse(id, {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVER_INFO,
      });

    case 'notifications/initialized':
      // Client acknowledgement – no response needed
      return null;

    case 'tools/list':
      return jsonRpcResponse(id, { tools: TOOLS });

    case 'tools/call': {
      const toolName = params?.name;
      const toolArgs = params?.arguments || {};

      const handler = TOOL_HANDLERS[toolName];
      if (!handler) {
        return jsonRpcError(id, -32602, `Unknown tool: ${toolName}`);
      }

      try {
        const result = await handler(toolArgs);
        return jsonRpcResponse(id, {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        });
      } catch (err) {
        return jsonRpcResponse(id, {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ error: err.message }),
            },
          ],
          isError: true,
        });
      }
    }

    case 'ping':
      return jsonRpcResponse(id, {});

    default:
      return jsonRpcError(id, -32601, `Method not found: ${method}`);
  }
}

// ---------------------------------------------------------------------------
// Netlify Function handler
// ---------------------------------------------------------------------------

exports.handler = async (event) => {
  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: corsHeaders(),
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed. Use POST.' }),
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return {
      statusCode: 400,
      headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(
        jsonRpcError(null, -32700, 'Parse error: invalid JSON')
      ),
    };
  }

  const accept = (event.headers['accept'] || '').toLowerCase();
  const wantsSSE = accept.includes('text/event-stream');

  // Handle batch requests
  if (Array.isArray(body)) {
    const results = [];
    for (const req of body) {
      const res = await handleRpcRequest(req);
      if (res) results.push(res);
    }
    return formatResponse(results, wantsSSE);
  }

  // Single request
  const result = await handleRpcRequest(body);

  // Notifications return no response body
  if (!result) {
    return {
      statusCode: 204,
      headers: corsHeaders(),
    };
  }

  return formatResponse(result, wantsSSE);
};

function formatResponse(data, sse) {
  if (sse) {
    const items = Array.isArray(data) ? data : [data];
    const sseBody = items
      .map((item) => `event: message\ndata: ${JSON.stringify(item)}\n`)
      .join('\n');

    return {
      statusCode: 200,
      headers: {
        ...corsHeaders(),
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
      body: sseBody,
    };
  }

  return {
    statusCode: 200,
    headers: {
      ...corsHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  };
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers':
      'Content-Type, Accept, Authorization, X-User-ID',
  };
}
