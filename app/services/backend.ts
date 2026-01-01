const BASE_URL = process.env.APP_BASE_URL || 'http://localhost:4000';

async function request(path: string, options: RequestInit = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-correlation-id': `${Date.now()}`,
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || 'Request failed');
  }
  return res.json();
}

export const backendClient = {
  healthCheck: () => request('/health'),
  createSubscription: (userId: string, planId: string) =>
    request('/integrations/subscribe', {
      method: 'POST',
      body: JSON.stringify({ userId, planId }),
    }),
  createPlaidLinkToken: (userId: string) =>
    request('/integrations/plaid/link-token', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),
  exchangePlaidPublicToken: (publicToken: string, userId: string) =>
    request('/integrations/plaid/exchange', {
      method: 'POST',
      body: JSON.stringify({ publicToken, userId }),
    }),
  fetchCatalog: () => request('/catalog'),
  fetchEntitlements: (userId: string) => request(`/entitlements?userId=${userId}`),
  purchase: (productId: string, userId: string) =>
    request('/purchase', {
      method: 'POST',
      body: JSON.stringify({ productId, userId }),
    }),
  createPayPalSubscription: (userId: string, planId: string) =>
    request('/billing/paypal/subscription/create', {
      method: 'POST',
      body: JSON.stringify({ userId, planId }),
    }),
  confirmPayPalSubscription: (providerSubscriptionId: string, userId: string) =>
    request('/billing/paypal/subscription/confirm', {
      method: 'POST',
      body: JSON.stringify({ providerSubscriptionId, userId }),
    }),
  cancelPayPalSubscription: (providerSubscriptionId: string) =>
    request('/billing/paypal/subscription/cancel', {
      method: 'POST',
      body: JSON.stringify({ providerSubscriptionId }),
    }),
  updatePaymentMethod: (userId: string, paymentMethodId: string) =>
    request('/billing/payment-method', {
      method: 'POST',
      body: JSON.stringify({ userId, paymentMethodId }),
    }),
  recordMetricsEvent: (event: {
    eventType: string;
    userId?: string;
    ts?: string;
    properties?: Record<string, unknown>;
    correlationId?: string;
    source?: string;
  }) =>
    request('/metrics/events', {
      method: 'POST',
      body: JSON.stringify(event),
    }),
  runDailyRollup: (asOf?: string) =>
    request('/metrics/rollup/daily', {
      method: 'POST',
      body: JSON.stringify({ asOf }),
    }),
  fetchDailyRollup: (userId: string, date?: string) =>
    request(`/metrics/rollup/daily?userId=${userId}${date ? `&date=${date}` : ''}`),
};
