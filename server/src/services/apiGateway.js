import { v4 as uuid } from 'uuid';
import crypto from 'crypto';
import { Models } from '../models.js';

// Initialize storage
if (!Models.apiKeys) Models.apiKeys = new Map();
if (!Models.rateLimits) Models.rateLimits = new Map();
if (!Models.providerConfigs) Models.providerConfigs = new Map();
if (!Models.apiUsage) Models.apiUsage = new Map();
if (!Models.accessTiers) Models.accessTiers = new Map();

// Default tier configurations
const DEFAULT_TIERS = {
  free: {
    name: 'Free',
    rateLimit: 100, // requests per hour
    dailyLimit: 500,
    features: ['basic_earning_tracking', 'expense_logging'],
    providers: ['basic'],
    priority: 1,
    price: 0,
  },
  starter: {
    name: 'Starter',
    rateLimit: 500,
    dailyLimit: 5000,
    features: ['basic_earning_tracking', 'expense_logging', 'multi_platform', 'cash_advances'],
    providers: ['basic', 'earnin'],
    priority: 2,
    price: 4.99,
  },
  pro: {
    name: 'Pro',
    rateLimit: 2000,
    dailyLimit: 20000,
    features: ['basic_earning_tracking', 'expense_logging', 'multi_platform', 'cash_advances', 'route_optimization', 'benefits_auto_reserve', 'analytics'],
    providers: ['basic', 'earnin', 'catch', 'expensify'],
    priority: 3,
    price: 12.99,
  },
  enterprise: {
    name: 'Enterprise',
    rateLimit: 10000,
    dailyLimit: 100000,
    features: ['*'], // All features
    providers: ['*'], // All providers
    priority: 4,
    price: 49.99,
  },
};

// Initialize default tiers
for (const [key, tier] of Object.entries(DEFAULT_TIERS)) {
  if (!Models.accessTiers.has(key)) {
    Models.accessTiers.set(key, { ...tier, id: key });
  }
}

export const ApiGatewayService = {
  // Generate API key
  generateApiKey: ({ userId, tier = 'free', name, expiresIn }) => {
    const keyId = uuid();
    const secret = crypto.randomBytes(32).toString('hex');
    const apiKey = `mgn_${tier}_${secret.substring(0, 32)}`;
    const hashedKey = crypto.createHash('sha256').update(apiKey).digest('hex');

    const keyRecord = {
      id: keyId,
      userId,
      tier,
      name: name || 'Default Key',
      hashedKey,
      prefix: apiKey.substring(0, 12) + '...',
      createdAt: new Date().toISOString(),
      expiresAt: expiresIn ? new Date(Date.now() + expiresIn).toISOString() : null,
      isActive: true,
      lastUsed: null,
      usageCount: 0,
    };

    Models.apiKeys.set(hashedKey, keyRecord);
    Models.auditLog.push({ type: 'api_key_created', userId, keyId, tier });
    
    // Return the actual key only once
    return { 
      keyId, 
      apiKey, 
      prefix: keyRecord.prefix,
      tier,
      expiresAt: keyRecord.expiresAt,
      message: 'Store this key securely. It won\'t be shown again.'
    };
  },

  // Validate API key
  validateApiKey: (apiKey) => {
    const hashedKey = crypto.createHash('sha256').update(apiKey).digest('hex');
    const keyRecord = Models.apiKeys.get(hashedKey);

    if (!keyRecord) {
      return { valid: false, error: 'invalid_key' };
    }

    if (!keyRecord.isActive) {
      return { valid: false, error: 'key_revoked' };
    }

    if (keyRecord.expiresAt && new Date(keyRecord.expiresAt) < new Date()) {
      return { valid: false, error: 'key_expired' };
    }

    // Update usage
    keyRecord.lastUsed = new Date().toISOString();
    keyRecord.usageCount++;

    const tier = Models.accessTiers.get(keyRecord.tier) || DEFAULT_TIERS.free;

    return {
      valid: true,
      userId: keyRecord.userId,
      tier: keyRecord.tier,
      tierConfig: tier,
      keyId: keyRecord.id,
    };
  },

  // Revoke API key
  revokeApiKey: ({ keyId, userId }) => {
    for (const [hash, record] of Models.apiKeys.entries()) {
      if (record.id === keyId && record.userId === userId) {
        record.isActive = false;
        record.revokedAt = new Date().toISOString();
        Models.auditLog.push({ type: 'api_key_revoked', userId, keyId });
        return { revoked: true };
      }
    }
    throw new Error('key_not_found');
  },

  // List user's API keys
  listApiKeys: ({ userId }) => {
    const keys = [];
    for (const record of Models.apiKeys.values()) {
      if (record.userId === userId) {
        keys.push({
          id: record.id,
          name: record.name,
          prefix: record.prefix,
          tier: record.tier,
          createdAt: record.createdAt,
          expiresAt: record.expiresAt,
          isActive: record.isActive,
          lastUsed: record.lastUsed,
          usageCount: record.usageCount,
        });
      }
    }
    return { keys };
  },

  // Check rate limit
  checkRateLimit: ({ userId, tier }) => {
    const tierConfig = Models.accessTiers.get(tier) || DEFAULT_TIERS.free;
    const now = Date.now();
    const hourKey = `${userId}:hour:${Math.floor(now / 3600000)}`;
    const dayKey = `${userId}:day:${Math.floor(now / 86400000)}`;

    const hourCount = Models.rateLimits.get(hourKey) || 0;
    const dayCount = Models.rateLimits.get(dayKey) || 0;

    // Check hourly limit
    if (hourCount >= tierConfig.rateLimit) {
      Models.metrics.increment('api.rate_limited.hourly');
      return {
        allowed: false,
        reason: 'hourly_limit_exceeded',
        limit: tierConfig.rateLimit,
        current: hourCount,
        resetIn: 3600000 - (now % 3600000),
      };
    }

    // Check daily limit
    if (dayCount >= tierConfig.dailyLimit) {
      Models.metrics.increment('api.rate_limited.daily');
      return {
        allowed: false,
        reason: 'daily_limit_exceeded',
        limit: tierConfig.dailyLimit,
        current: dayCount,
        resetIn: 86400000 - (now % 86400000),
      };
    }

    // Increment counters
    Models.rateLimits.set(hourKey, hourCount + 1);
    Models.rateLimits.set(dayKey, dayCount + 1);

    return {
      allowed: true,
      hourlyRemaining: tierConfig.rateLimit - hourCount - 1,
      dailyRemaining: tierConfig.dailyLimit - dayCount - 1,
    };
  },

  // Check feature access
  checkFeatureAccess: ({ tier, feature }) => {
    const tierConfig = Models.accessTiers.get(tier) || DEFAULT_TIERS.free;
    
    if (tierConfig.features.includes('*')) {
      return { allowed: true, tier };
    }

    if (tierConfig.features.includes(feature)) {
      return { allowed: true, tier };
    }

    // Find minimum tier for this feature
    let requiredTier = null;
    for (const [name, config] of Models.accessTiers.entries()) {
      if (config.features.includes('*') || config.features.includes(feature)) {
        if (!requiredTier || config.priority < Models.accessTiers.get(requiredTier).priority) {
          requiredTier = name;
        }
      }
    }

    return {
      allowed: false,
      reason: 'feature_not_available',
      feature,
      currentTier: tier,
      requiredTier,
      upgradePrice: requiredTier ? Models.accessTiers.get(requiredTier).price : null,
    };
  },

  // Route to provider
  selectProvider: ({ tier, providerType, preferredProvider }) => {
    const tierConfig = Models.accessTiers.get(tier) || DEFAULT_TIERS.free;
    
    // Check if tier has access to preferred provider
    if (preferredProvider) {
      if (tierConfig.providers.includes('*') || tierConfig.providers.includes(preferredProvider)) {
        return {
          provider: preferredProvider,
          authorized: true,
        };
      }
    }

    // Select best available provider for the tier
    const availableProviders = tierConfig.providers.includes('*')
      ? ['basic', 'earnin', 'catch', 'expensify', 'shiftmate', 'plaid']
      : tierConfig.providers;

    // Provider priority mapping
    const providerPriority = {
      plaid: 6,
      expensify: 5,
      catch: 4,
      earnin: 3,
      shiftmate: 2,
      basic: 1,
    };

    // Filter by type if specified
    const typeMapping = {
      bank: ['plaid', 'basic'],
      expenses: ['expensify', 'basic'],
      benefits: ['catch', 'basic'],
      advances: ['earnin', 'basic'],
      scheduling: ['shiftmate', 'basic'],
    };

    let candidates = availableProviders;
    if (providerType && typeMapping[providerType]) {
      candidates = availableProviders.filter(p => typeMapping[providerType].includes(p));
    }

    // Sort by priority
    candidates.sort((a, b) => (providerPriority[b] || 0) - (providerPriority[a] || 0));

    return {
      provider: candidates[0] || 'basic',
      authorized: true,
      alternatives: candidates.slice(1),
    };
  },

  // Record API usage
  recordUsage: ({ userId, endpoint, method, tier, responseTime, statusCode }) => {
    const usage = {
      id: uuid(),
      userId,
      endpoint,
      method,
      tier,
      responseTime,
      statusCode,
      timestamp: new Date().toISOString(),
    };

    const userUsage = Models.apiUsage.get(userId) || [];
    userUsage.push(usage);
    // Keep last 1000 requests
    if (userUsage.length > 1000) {
      userUsage.shift();
    }
    Models.apiUsage.set(userId, userUsage);

    Models.metrics.increment(`api.requests.${tier}`);
    if (statusCode >= 400) {
      Models.metrics.increment('api.errors');
    }

    return usage;
  },

  // Get usage statistics
  getUsageStats: ({ userId, startDate, endDate }) => {
    const userUsage = Models.apiUsage.get(userId) || [];
    
    let filtered = userUsage;
    if (startDate) {
      filtered = filtered.filter(u => new Date(u.timestamp) >= new Date(startDate));
    }
    if (endDate) {
      filtered = filtered.filter(u => new Date(u.timestamp) <= new Date(endDate));
    }

    const byEndpoint = {};
    const byMethod = {};
    let totalResponseTime = 0;
    let errorCount = 0;

    for (const usage of filtered) {
      byEndpoint[usage.endpoint] = (byEndpoint[usage.endpoint] || 0) + 1;
      byMethod[usage.method] = (byMethod[usage.method] || 0) + 1;
      totalResponseTime += usage.responseTime || 0;
      if (usage.statusCode >= 400) errorCount++;
    }

    return {
      userId,
      totalRequests: filtered.length,
      avgResponseTime: filtered.length > 0 ? totalResponseTime / filtered.length : 0,
      errorRate: filtered.length > 0 ? errorCount / filtered.length : 0,
      byEndpoint,
      byMethod,
      period: { startDate, endDate },
    };
  },

  // Upgrade tier
  upgradeTier: ({ userId, newTier }) => {
    const tierConfig = Models.accessTiers.get(newTier);
    if (!tierConfig) {
      throw new Error('invalid_tier');
    }

    // Update all user's active keys to new tier
    for (const record of Models.apiKeys.values()) {
      if (record.userId === userId && record.isActive) {
        record.tier = newTier;
        record.upgradedAt = new Date().toISOString();
      }
    }

    Models.auditLog.push({ type: 'tier_upgraded', userId, newTier });

    return {
      success: true,
      tier: newTier,
      tierConfig,
    };
  },

  // Get available tiers
  getTiers: () => {
    return Array.from(Models.accessTiers.values()).sort((a, b) => a.priority - b.priority);
  },

  // Health check for providers
  getProviderHealth: () => {
    const providers = ['plaid', 'earnin', 'catch', 'expensify', 'shiftmate', 'basic'];
    const health = {};

    for (const provider of providers) {
      health[provider] = {
        status: 'healthy',
        latency: Math.random() * 100 + 50, // Simulated
        lastCheck: new Date().toISOString(),
        errorRate: Math.random() * 0.05,
      };
    }

    return { providers: health, checkedAt: new Date().toISOString() };
  },
};
