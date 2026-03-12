const BASE_URL = process.env.APP_BASE_URL || 'http://localhost:4000';
const API_V1 = '/api/v1';

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

  // ==================== GIG PLATFORMS ====================
  getSupportedPlatforms: () => request(`${API_V1}/platforms`),
  
  connectPlatform: (userId: string, platform: string, credentials?: Record<string, unknown>) =>
    request(`${API_V1}/platforms/connect`, {
      method: 'POST',
      body: JSON.stringify({ userId, platform, credentials }),
    }),
  
  getConnectedPlatforms: (userId: string) =>
    request(`${API_V1}/platforms/connected?userId=${userId}`),
  
  disconnectPlatform: (connectionId: string, userId: string) =>
    request(`${API_V1}/platforms/disconnect`, {
      method: 'POST',
      body: JSON.stringify({ connectionId, userId }),
    }),
  
  getAggregatedJobs: (userId: string, options?: { category?: string; limit?: number; offset?: number }) =>
    request(`${API_V1}/jobs?userId=${userId}${options?.category ? `&category=${options.category}` : ''}${options?.limit ? `&limit=${options.limit}` : ''}${options?.offset ? `&offset=${options.offset}` : ''}`),

  // ==================== SHIFTS & EARNINGS ====================
  recordShift: (data: {
    userId: string;
    platform: string;
    startTime: string;
    endTime?: string;
    earnings?: number;
    mileage?: number;
    expenses?: number;
  }) =>
    request(`${API_V1}/shifts`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  getShiftAnalytics: (userId: string, startDate?: string, endDate?: string) =>
    request(`${API_V1}/shifts/analytics?userId=${userId}${startDate ? `&startDate=${startDate}` : ''}${endDate ? `&endDate=${endDate}` : ''}`),
  
  recordEarnings: (data: { userId: string; platform: string; amount: number; shiftId?: string }) =>
    request(`${API_V1}/earnings`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  getEarningsSummary: (userId: string, options?: { startDate?: string; endDate?: string; groupBy?: string }) =>
    request(`${API_V1}/earnings/summary?userId=${userId}${options?.startDate ? `&startDate=${options.startDate}` : ''}${options?.endDate ? `&endDate=${options.endDate}` : ''}${options?.groupBy ? `&groupBy=${options.groupBy}` : ''}`),

  // ==================== CASH ADVANCES ====================
  getAdvanceTerms: () => request(`${API_V1}/advances/terms`),
  
  checkAdvanceEligibility: (userId: string) =>
    request(`${API_V1}/advances/eligibility?userId=${userId}`),
  
  requestAdvance: (data: { userId: string; amount: number; deliveryMethod?: 'standard' | 'instant'; destination?: string }) =>
    request(`${API_V1}/advances/request`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  getAdvanceHistory: (userId: string, status?: string) =>
    request(`${API_V1}/advances/history?userId=${userId}${status ? `&status=${status}` : ''}`),

  // ==================== BENEFITS & TAX ====================
  initializeBenefitsBuckets: (userId: string, allocations?: Record<string, number>) =>
    request(`${API_V1}/benefits/initialize`, {
      method: 'POST',
      body: JSON.stringify({ userId, allocations }),
    }),
  
  getBenefitsBuckets: (userId: string) => request(`${API_V1}/benefits/buckets?userId=${userId}`),
  
  updateBucketAllocation: (bucketId: string, userId: string, allocationPercent: number) =>
    request(`${API_V1}/benefits/buckets/${bucketId}/allocation`, {
      method: 'PUT',
      body: JSON.stringify({ userId, allocationPercent }),
    }),
  
  allocateEarnings: (userId: string, earningsAmount: number, source?: string) =>
    request(`${API_V1}/benefits/allocate`, {
      method: 'POST',
      body: JSON.stringify({ userId, earningsAmount, source }),
    }),
  
  withdrawFromBucket: (bucketId: string, userId: string, amount: number, reason?: string) =>
    request(`${API_V1}/benefits/withdraw`, {
      method: 'POST',
      body: JSON.stringify({ bucketId, userId, amount, reason }),
    }),
  
  getBenefitsSummary: (userId: string) => request(`${API_V1}/benefits/summary?userId=${userId}`),
  
  getTaxEstimate: (userId: string, annualIncome: number) =>
    request(`${API_V1}/benefits/tax-estimate?userId=${userId}&annualIncome=${annualIncome}`),

  // ==================== EXPENSES ====================
  getExpenseCategories: () => request(`${API_V1}/expenses/categories`),
  
  getMileageRate: () => request(`${API_V1}/expenses/mileage-rate`),
  
  recordExpense: (data: {
    userId: string;
    amount: number;
    categoryId: string;
    description?: string;
    date?: string;
    receiptUrl?: string;
  }) =>
    request(`${API_V1}/expenses`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  recordMileage: (data: {
    userId: string;
    miles: number;
    date?: string;
    purpose?: string;
    startLocation?: string;
    endLocation?: string;
    roundTrip?: boolean;
  }) =>
    request(`${API_V1}/expenses/mileage`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  getExpenses: (userId: string, options?: { startDate?: string; endDate?: string; categoryId?: string; limit?: number }) =>
    request(`${API_V1}/expenses?userId=${userId}${options?.startDate ? `&startDate=${options.startDate}` : ''}${options?.endDate ? `&endDate=${options.endDate}` : ''}${options?.categoryId ? `&categoryId=${options.categoryId}` : ''}${options?.limit ? `&limit=${options.limit}` : ''}`),
  
  getMileageRecords: (userId: string, options?: { startDate?: string; endDate?: string }) =>
    request(`${API_V1}/expenses/mileage?userId=${userId}${options?.startDate ? `&startDate=${options.startDate}` : ''}${options?.endDate ? `&endDate=${options.endDate}` : ''}`),
  
  getExpenseSummary: (userId: string, options?: { startDate?: string; endDate?: string; groupBy?: string }) =>
    request(`${API_V1}/expenses/summary?userId=${userId}${options?.startDate ? `&startDate=${options.startDate}` : ''}${options?.endDate ? `&endDate=${options.endDate}` : ''}${options?.groupBy ? `&groupBy=${options.groupBy}` : ''}`),
  
  exportExpenses: (userId: string, year: number) =>
    request(`${API_V1}/expenses/export?userId=${userId}&year=${year}`),
  
  deleteExpense: (expenseId: string, userId: string) =>
    request(`${API_V1}/expenses/${expenseId}?userId=${userId}`, { method: 'DELETE' }),

  // ==================== NOTIFICATIONS ====================
  getNotifications: (userId: string, options?: { unreadOnly?: boolean; limit?: number }) =>
    request(`${API_V1}/notifications?userId=${userId}${options?.unreadOnly ? '&unreadOnly=true' : ''}${options?.limit ? `&limit=${options.limit}` : ''}`),
  
  getNotificationTypes: () => request(`${API_V1}/notifications/types`),
  
  getNotificationPreferences: (userId: string) =>
    request(`${API_V1}/notifications/preferences?userId=${userId}`),
  
  updateNotificationPreferences: (userId: string, preferences: Record<string, { push?: boolean; email?: boolean; sms?: boolean }>) =>
    request(`${API_V1}/notifications/preferences`, {
      method: 'PUT',
      body: JSON.stringify({ userId, preferences }),
    }),
  
  markNotificationAsRead: (notificationId: string, userId: string) =>
    request(`${API_V1}/notifications/${notificationId}/read?userId=${userId}`, { method: 'POST' }),
  
  markAllNotificationsAsRead: (userId: string) =>
    request(`${API_V1}/notifications/read-all`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),
  
  dismissNotification: (notificationId: string, userId: string) =>
    request(`${API_V1}/notifications/${notificationId}/dismiss?userId=${userId}`, { method: 'POST' }),
  
  registerPushSubscription: (userId: string, subscription: unknown, platform: string) =>
    request(`${API_V1}/notifications/push/subscribe`, {
      method: 'POST',
      body: JSON.stringify({ userId, subscription, platform }),
    }),

  // ==================== USER PROFILE ====================
  getWorkModes: () => request(`${API_V1}/profile/work-modes`),
  
  getGoalTypes: () => request(`${API_V1}/profile/goal-types`),
  
  getProfile: (userId: string) => request(`${API_V1}/profile?userId=${userId}`),
  
  updateProfile: (data: {
    userId: string;
    displayName?: string;
    email?: string;
    timezone?: string;
    workMode?: string;
    workAreas?: string[];
  }) =>
    request(`${API_V1}/profile`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  getSettings: (userId: string) => request(`${API_V1}/profile/settings?userId=${userId}`),
  
  updateSettings: (userId: string, settings: Record<string, unknown>) =>
    request(`${API_V1}/profile/settings`, {
      method: 'PUT',
      body: JSON.stringify({ userId, ...settings }),
    }),
  
  setWorkMode: (userId: string, workMode: string) =>
    request(`${API_V1}/profile/work-mode`, {
      method: 'POST',
      body: JSON.stringify({ userId, workMode }),
    }),
  
  getGoals: (userId: string, status?: string) =>
    request(`${API_V1}/profile/goals?userId=${userId}${status ? `&status=${status}` : ''}`),
  
  createGoal: (data: { userId: string; type: string; target: number; period?: string }) =>
    request(`${API_V1}/profile/goals`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  updateGoalProgress: (goalId: string, userId: string, progress: number) =>
    request(`${API_V1}/profile/goals/${goalId}/progress`, {
      method: 'PUT',
      body: JSON.stringify({ userId, progress }),
    }),
  
  deleteGoal: (goalId: string, userId: string) =>
    request(`${API_V1}/profile/goals/${goalId}?userId=${userId}`, { method: 'DELETE' }),
  
  getDashboard: (userId: string) => request(`${API_V1}/dashboard?userId=${userId}`),

  // ==================== ROUTE OPTIMIZATION ====================
  recordSurgeZone: (data: {
    platform: string;
    latitude: number;
    longitude: number;
    multiplier: number;
    expiresIn?: number;
  }) =>
    request(`${API_V1}/routes/surge-zones`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  getActiveSurgeZones: (options?: { platform?: string; latitude?: number; longitude?: number; radius?: number }) =>
    request(`${API_V1}/routes/surge-zones?${new URLSearchParams(options as Record<string, string>).toString()}`),
  
  optimizeRoute: (locations: Array<{ latitude: number; longitude: number; name?: string }>, startLocation?: { latitude: number; longitude: number }, returnToStart?: boolean) =>
    request(`${API_V1}/routes/optimize`, {
      method: 'POST',
      body: JSON.stringify({ locations, startLocation, returnToStart }),
    }),
  
  getEarningsHeatmap: (userId: string, bounds?: { north: number; south: number; east: number; west: number }, resolution?: number) =>
    request(`${API_V1}/routes/heatmap?userId=${userId}${bounds ? `&bounds=${JSON.stringify(bounds)}` : ''}${resolution ? `&resolution=${resolution}` : ''}`),
  
  getBestWorkTimes: (userId: string) =>
    request(`${API_V1}/routes/best-times?userId=${userId}`),
  
  recordLocation: (userId: string, latitude: number, longitude: number, accuracy?: number) =>
    request(`${API_V1}/routes/location`, {
      method: 'POST',
      body: JSON.stringify({ userId, latitude, longitude, accuracy }),
    }),
  
  batchDeliveries: (deliveries: Array<{ id: string; latitude: number; longitude: number }>, maxPerBatch?: number) =>
    request(`${API_V1}/routes/batch-deliveries`, {
      method: 'POST',
      body: JSON.stringify({ deliveries, maxPerBatch }),
    }),

  // ==================== FRAUD DETECTION ====================
  assessRisk: (data: {
    userId: string;
    actionType: string;
    amount?: number;
    deviceFingerprint?: string;
    ip?: string;
    metadata?: Record<string, unknown>;
  }) =>
    request(`${API_V1}/fraud/assess`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  registerDevice: (userId: string, fingerprint: string, metadata?: Record<string, unknown>) =>
    request(`${API_V1}/fraud/device`, {
      method: 'POST',
      body: JSON.stringify({ userId, fingerprint, metadata }),
    }),
  
  generateFingerprint: (data: {
    userAgent?: string;
    ip?: string;
    screenResolution?: string;
    timezone?: string;
    language?: string;
    hardwareConcurrency?: number;
    deviceMemory?: number;
  }) =>
    request(`${API_V1}/fraud/fingerprint`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  getUserRiskProfile: (userId: string) =>
    request(`${API_V1}/fraud/profile?userId=${userId}`),
  
  getFraudAlerts: (options?: { status?: string; severity?: string; userId?: string; limit?: number }) =>
    request(`${API_V1}/fraud/alerts?${new URLSearchParams(options as Record<string, string>).toString()}`),
  
  resolveFraudAlert: (alertId: string, resolvedBy: string, resolution: string) =>
    request(`${API_V1}/fraud/alerts/${alertId}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ resolvedBy, resolution }),
    }),
  
  blockEntity: (data: { entityType: string; entityValue: string; reason: string; expiresAt?: string; blockedBy: string }) =>
    request(`${API_V1}/fraud/block`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  unblockEntity: (entityType: string, entityValue: string, unblockedBy: string, reason: string) =>
    request(`${API_V1}/fraud/unblock`, {
      method: 'POST',
      body: JSON.stringify({ entityType, entityValue, unblockedBy, reason }),
    }),

  // ==================== API GATEWAY ====================
  generateApiKey: (userId: string, tier?: string, name?: string, expiresIn?: number) =>
    request(`${API_V1}/api-keys`, {
      method: 'POST',
      body: JSON.stringify({ userId, tier, name, expiresIn }),
    }),
  
  listApiKeys: (userId: string) =>
    request(`${API_V1}/api-keys?userId=${userId}`),
  
  revokeApiKey: (keyId: string, userId: string) =>
    request(`${API_V1}/api-keys/${keyId}?userId=${userId}`, { method: 'DELETE' }),
  
  getAccessTiers: () => request(`${API_V1}/tiers`),
  
  upgradeTier: (userId: string, newTier: string) =>
    request(`${API_V1}/tiers/upgrade`, {
      method: 'POST',
      body: JSON.stringify({ userId, newTier }),
    }),
  
  getUsageStats: (userId: string, startDate?: string, endDate?: string) =>
    request(`${API_V1}/usage?userId=${userId}${startDate ? `&startDate=${startDate}` : ''}${endDate ? `&endDate=${endDate}` : ''}`),
  
  checkFeatureAccess: (tier: string, feature: string) =>
    request(`${API_V1}/access/feature?tier=${tier}&feature=${feature}`),
  
  getProviderHealth: () => request(`${API_V1}/providers/health`),

  // ==================== AUTOMATIONS ====================
  getAutomationOptions: () => request(`${API_V1}/automations/options`),
  
  getAutomationTemplates: () => request(`${API_V1}/automations/templates`),
  
  createAutomation: (data: {
    userId: string;
    name: string;
    triggerType: string;
    conditions?: Array<{ field: string; operator: string; value: unknown }>;
    actions: Array<{ type: string; config: Record<string, unknown> }>;
    isEnabled?: boolean;
  }) =>
    request(`${API_V1}/automations`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  createAutomationFromTemplate: (userId: string, templateId: string, customConfig?: Record<string, unknown>) =>
    request(`${API_V1}/automations/from-template`, {
      method: 'POST',
      body: JSON.stringify({ userId, templateId, customConfig }),
    }),
  
  getAutomations: (userId: string) =>
    request(`${API_V1}/automations?userId=${userId}`),
  
  updateAutomation: (automationId: string, userId: string, updates: Record<string, unknown>) =>
    request(`${API_V1}/automations/${automationId}`, {
      method: 'PUT',
      body: JSON.stringify({ userId, ...updates }),
    }),
  
  deleteAutomation: (automationId: string, userId: string) =>
    request(`${API_V1}/automations/${automationId}?userId=${userId}`, { method: 'DELETE' }),
  
  getAutomationLogs: (automationId: string, userId: string, limit?: number) =>
    request(`${API_V1}/automations/${automationId}/logs?userId=${userId}${limit ? `&limit=${limit}` : ''}`),
  
  fireAutomationTrigger: (triggerType: string, userId: string, payload: Record<string, unknown>) =>
    request(`${API_V1}/automations/trigger`, {
      method: 'POST',
      body: JSON.stringify({ triggerType, userId, payload }),
    }),
  
  createIncomingWebhook: (userId: string, name: string, triggerType: string) =>
    request(`${API_V1}/webhooks/incoming`, {
      method: 'POST',
      body: JSON.stringify({ userId, name, triggerType }),
    }),

  // ==================== ANALYTICS ====================
  getEarningsAnalytics: (userId: string, options?: { startDate?: string; endDate?: string; groupBy?: string }) =>
    request(`${API_V1}/analytics/earnings?userId=${userId}${options?.startDate ? `&startDate=${options.startDate}` : ''}${options?.endDate ? `&endDate=${options.endDate}` : ''}${options?.groupBy ? `&groupBy=${options.groupBy}` : ''}`),
  
  getProfitabilityAnalysis: (userId: string, startDate?: string, endDate?: string) =>
    request(`${API_V1}/analytics/profitability?userId=${userId}${startDate ? `&startDate=${startDate}` : ''}${endDate ? `&endDate=${endDate}` : ''}`),
  
  getTimeAnalysis: (userId: string, startDate?: string, endDate?: string) =>
    request(`${API_V1}/analytics/time?userId=${userId}${startDate ? `&startDate=${startDate}` : ''}${endDate ? `&endDate=${endDate}` : ''}`),
  
  getGoalProgress: (userId: string) =>
    request(`${API_V1}/analytics/goals?userId=${userId}`),
  
  getTaxSummary: (userId: string, startDate?: string, endDate?: string) =>
    request(`${API_V1}/analytics/tax?userId=${userId}${startDate ? `&startDate=${startDate}` : ''}${endDate ? `&endDate=${endDate}` : ''}`),
  
  comparePeriods: (userId: string, period1Start: string, period1End: string, period2Start: string, period2End: string) =>
    request(`${API_V1}/analytics/compare?userId=${userId}&period1Start=${period1Start}&period1End=${period1End}&period2Start=${period2Start}&period2End=${period2End}`),
  
  generateReport: (data: { userId: string; reportType: string; startDate?: string; endDate?: string; options?: Record<string, unknown> }) =>
    request(`${API_V1}/reports`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  getReports: (userId: string, limit?: number) =>
    request(`${API_V1}/reports?userId=${userId}${limit ? `&limit=${limit}` : ''}`),

  // ==================== COMPLIANCE ====================
  initiateKyc: (userId: string, level?: string) =>
    request(`${API_V1}/compliance/kyc/initiate`, {
      method: 'POST',
      body: JSON.stringify({ userId, level }),
    }),
  
  getKycStatus: (userId: string) =>
    request(`${API_V1}/compliance/kyc/status?userId=${userId}`),
  
  submitKycIdentity: (sessionId: string, data: { firstName: string; lastName: string; dateOfBirth: string; ssn: string }) =>
    request(`${API_V1}/compliance/kyc/identity`, {
      method: 'POST',
      body: JSON.stringify({ sessionId, ...data }),
    }),
  
  submitKycAddress: (sessionId: string, data: { street: string; city: string; state: string; zipCode: string; country: string }) =>
    request(`${API_V1}/compliance/kyc/address`, {
      method: 'POST',
      body: JSON.stringify({ sessionId, ...data }),
    }),
  
  submitKycDocument: (sessionId: string, documentType: string, documentData: unknown) =>
    request(`${API_V1}/compliance/kyc/document`, {
      method: 'POST',
      body: JSON.stringify({ sessionId, documentType, documentData }),
    }),
  
  recordConsent: (data: { userId: string; consentType: string; version: string; ipAddress?: string; userAgent?: string }) =>
    request(`${API_V1}/compliance/consent`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  checkConsent: (userId: string, consentType: string, requiredVersion?: string) =>
    request(`${API_V1}/compliance/consent/check?userId=${userId}&consentType=${consentType}${requiredVersion ? `&requiredVersion=${requiredVersion}` : ''}`),
  
  revokeConsent: (userId: string, consentType: string) =>
    request(`${API_V1}/compliance/consent/revoke`, {
      method: 'POST',
      body: JSON.stringify({ userId, consentType }),
    }),
  
  createDataRequest: (userId: string, requestType: 'access' | 'deletion' | 'portability' | 'rectification' | 'restriction') =>
    request(`${API_V1}/compliance/data-request`, {
      method: 'POST',
      body: JSON.stringify({ userId, requestType }),
    }),
  
  exportUserData: (userId: string) =>
    request(`${API_V1}/compliance/export?userId=${userId}`),
  
  getComplianceSummary: (userId: string) =>
    request(`${API_V1}/compliance/summary?userId=${userId}`),

  // ==================== MARKETPLACE ====================
  registerAsDeveloper: (data: { userId: string; companyName: string; website?: string; contactEmail: string }) =>
    request(`${API_V1}/marketplace/developers`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  createPlugin: (data: {
    developerId: string;
    name: string;
    description: string;
    category: string;
    version: string;
    pricing?: { type: string; price: number };
    permissions?: string[];
    webhookUrl?: string;
    iconUrl?: string;
    screenshots?: string[];
  }) =>
    request(`${API_V1}/marketplace/plugins`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  listPlugins: (options?: { category?: string; search?: string; sort?: string; page?: number; limit?: number }) =>
    request(`${API_V1}/marketplace/plugins?${new URLSearchParams(options as Record<string, string>).toString()}`),
  
  getPlugin: (pluginId: string) =>
    request(`${API_V1}/marketplace/plugins/${pluginId}`),
  
  installPlugin: (pluginId: string, userId: string) =>
    request(`${API_V1}/marketplace/plugins/${pluginId}/install`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),
  
  uninstallPlugin: (pluginId: string, userId: string) =>
    request(`${API_V1}/marketplace/plugins/${pluginId}/install?userId=${userId}`, { method: 'DELETE' }),
  
  getInstalledPlugins: (userId: string) =>
    request(`${API_V1}/marketplace/installed?userId=${userId}`),
  
  updatePluginSettings: (pluginId: string, userId: string, settings: Record<string, unknown>) =>
    request(`${API_V1}/marketplace/plugins/${pluginId}/settings`, {
      method: 'PUT',
      body: JSON.stringify({ userId, settings }),
    }),
  
  ratePlugin: (pluginId: string, userId: string, rating: number, review?: string) =>
    request(`${API_V1}/marketplace/plugins/${pluginId}/rate`, {
      method: 'POST',
      body: JSON.stringify({ userId, rating, review }),
    }),
  
  getMarketplaceStats: () => request(`${API_V1}/marketplace/stats`),
  
  createWhiteLabelConfig: (data: {
    partnerId: string;
    brandName: string;
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    customDomain?: string;
    features?: string[];
    apiAccess?: string;
  }) =>
    request(`${API_V1}/marketplace/whitelabel`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  getWhiteLabelConfig: (partnerId?: string, customDomain?: string) =>
    request(`${API_V1}/marketplace/whitelabel?${partnerId ? `partnerId=${partnerId}` : ''}${customDomain ? `customDomain=${customDomain}` : ''}`),
  
  updateWhiteLabelConfig: (partnerId: string, updates: Record<string, unknown>) =>
    request(`${API_V1}/marketplace/whitelabel/${partnerId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),

  // ==================== CREDITS SYSTEM (GPT) ====================
  
  // Balance & Dashboard
  getCreditsBalance: (userId: string) =>
    request(`${API_V1}/credits/balance?userId=${userId}`),
  
  getCreditsDashboard: (userId: string) =>
    request(`${API_V1}/credits/dashboard?userId=${userId}`),
  
  getCreditsTransactions: (userId: string, options?: { type?: string; limit?: number; offset?: number }) =>
    request(`${API_V1}/credits/transactions?userId=${userId}${options?.type ? `&type=${options.type}` : ''}${options?.limit ? `&limit=${options.limit}` : ''}${options?.offset ? `&offset=${options.offset}` : ''}`),
  
  // Daily Check-in & Streaks
  dailyCheckin: (userId: string) =>
    request(`${API_V1}/credits/checkin`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),
  
  getStreakInfo: (userId: string) =>
    request(`${API_V1}/credits/streak?userId=${userId}`),
  
  // Surveys
  getAvailableSurveys: (userId: string, options?: { category?: string; limit?: number }) =>
    request(`${API_V1}/credits/surveys?userId=${userId}${options?.category ? `&category=${options.category}` : ''}${options?.limit ? `&limit=${options.limit}` : ''}`),
  
  startSurvey: (userId: string, surveyId: string) =>
    request(`${API_V1}/credits/surveys/${surveyId}/start`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),
  
  completeSurvey: (userId: string, surveyId: string, answers: unknown) =>
    request(`${API_V1}/credits/surveys/${surveyId}/complete`, {
      method: 'POST',
      body: JSON.stringify({ userId, answers }),
    }),
  
  // Games
  getAvailableGames: () =>
    request(`${API_V1}/credits/games`),
  
  recordGamePlay: (userId: string, gameId: string, result: string, score?: number) =>
    request(`${API_V1}/credits/games/${gameId}/play`, {
      method: 'POST',
      body: JSON.stringify({ userId, result, score }),
    }),
  
  // Offers
  getAvailableOffers: (userId: string, category?: string) =>
    request(`${API_V1}/credits/offers?userId=${userId}${category ? `&category=${category}` : ''}`),
  
  startOffer: (userId: string, offerId: string) =>
    request(`${API_V1}/credits/offers/${offerId}/start`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),
  
  completeOffer: (userId: string, offerId: string, trackingId?: string) =>
    request(`${API_V1}/credits/offers/${offerId}/complete`, {
      method: 'POST',
      body: JSON.stringify({ userId, trackingId }),
    }),
  
  // Video Ads
  getVideoAdAvailability: (userId: string) =>
    request(`${API_V1}/credits/ads/video?userId=${userId}`),
  
  watchVideoAd: (userId: string, adId?: string, duration?: number) =>
    request(`${API_V1}/credits/ads/video/watch`, {
      method: 'POST',
      body: JSON.stringify({ userId, adId, duration }),
    }),
  
  // Paid Search
  recordCreditSearch: (userId: string, query: string) =>
    request(`${API_V1}/credits/search`, {
      method: 'POST',
      body: JSON.stringify({ userId, query }),
    }),
  
  // Cashback
  getCashbackRetailers: () =>
    request(`${API_V1}/credits/cashback/retailers`),
  
  recordCashbackPurchase: (userId: string, retailerId: string, purchaseAmount: number, orderId?: string) =>
    request(`${API_V1}/credits/cashback/purchase`, {
      method: 'POST',
      body: JSON.stringify({ userId, retailerId, purchaseAmount, orderId }),
    }),
  
  // Social
  recordSocialShare: (userId: string, platform: string, contentType: string, contentId?: string) =>
    request(`${API_V1}/credits/social/share`, {
      method: 'POST',
      body: JSON.stringify({ userId, platform, contentType, contentId }),
    }),
  
  recordSocialPost: (userId: string, platform: string, postUrl: string, hashtag?: string) =>
    request(`${API_V1}/credits/social/post`, {
      method: 'POST',
      body: JSON.stringify({ userId, platform, postUrl, hashtag }),
    }),
  
  // Referrals
  getReferralCode: (userId: string) =>
    request(`${API_V1}/credits/referral?userId=${userId}`),
  
  applyReferralCode: (userId: string, referralCode: string) =>
    request(`${API_V1}/credits/referral/apply`, {
      method: 'POST',
      body: JSON.stringify({ userId, referralCode }),
    }),
  
  // Achievements
  getAchievements: (userId: string) =>
    request(`${API_V1}/credits/achievements?userId=${userId}`),
  
  // Tasks
  getAvailableTasks: (userId: string) =>
    request(`${API_V1}/credits/tasks?userId=${userId}`),
  
  completeTask: (userId: string, taskId: string, result?: unknown) =>
    request(`${API_V1}/credits/tasks/${taskId}/complete`, {
      method: 'POST',
      body: JSON.stringify({ userId, result }),
    }),
  
  // Receipts
  submitReceipt: (userId: string, retailer: string, purchaseAmount: number, receiptImageUrl?: string, items?: string[]) =>
    request(`${API_V1}/credits/receipts`, {
      method: 'POST',
      body: JSON.stringify({ userId, retailer, purchaseAmount, receiptImageUrl, items }),
    }),
  
  // Redemptions
  getRedemptionOptions: () =>
    request(`${API_V1}/credits/redemptions/options`),
  
  requestRedemption: (userId: string, type: string, credits: number, destination?: string) =>
    request(`${API_V1}/credits/redemptions`, {
      method: 'POST',
      body: JSON.stringify({ userId, type, credits, destination }),
    }),
  
  getRedemptionHistory: (userId: string, status?: string, limit?: number) =>
    request(`${API_V1}/credits/redemptions?userId=${userId}${status ? `&status=${status}` : ''}${limit ? `&limit=${limit}` : ''}`),
  
  // Leaderboard
  getCreditsLeaderboard: (period?: string, limit?: number) =>
    request(`${API_V1}/credits/leaderboard?${period ? `period=${period}` : ''}${limit ? `&limit=${limit}` : ''}`),
  
  // Bonus Events
  getActiveBonusEvents: () =>
    request(`${API_V1}/credits/events`),
  
  // Demo
  seedCreditsDemo: (userId: string) =>
    request(`${API_V1}/credits/demo/seed`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),
};
