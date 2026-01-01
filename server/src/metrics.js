import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';
import { Models } from './models.js';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const EVENTS_LOG_PATH = process.env.METRICS_LOG_PATH || path.join(DATA_DIR, 'metrics-events.ndjson');
const SENSITIVE_KEYS = ['description', 'merchant', 'merchantname', 'rawmerchant', 'raw_description'];

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function sanitizeProperties(properties = {}) {
  const sanitized = {};
  for (const [key, value] of Object.entries(properties || {})) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.some(sensitiveKey => lowerKey.includes(sensitiveKey))) continue;
    if (value === undefined) continue;
    sanitized[key] = value;
  }
  return sanitized;
}

function appendToLog(event) {
  ensureDataDir();
  const line = `${JSON.stringify(event)}\n`;
  fs.appendFile(EVENTS_LOG_PATH, line, err => {
    if (err) {
      console.warn('metrics_log_write_failed', err?.message || err);
    }
  });
}

function collectUserIds() {
  const ids = new Set();
  Models.users.forEach((_value, key) => ids.add(key));
  Models.subscriptions.forEach(sub => ids.add(sub.userId));
  Models.entitlements.forEach(ent => ids.add(ent.userId));
  Models.plaidItems.forEach(item => ids.add(item.userId));
  Models.metricsEvents.forEach(event => ids.add(event.userId));
  return Array.from(ids);
}

function normalizeTimestamp(ts) {
  const parsed = ts ? new Date(ts) : new Date();
  return parsed.toISOString();
}

function categoryFromTransaction(tx) {
  if (!tx) return null;
  if (tx.category) return tx.category;
  if (Array.isArray(tx.categories) && tx.categories.length > 0) return tx.categories[0];
  return null;
}

export const MetricsService = {
  isEnabled: () => Models.settings.analyticsEnabled !== false,

  setEnabled: enabled => {
    Models.settings.analyticsEnabled = !!enabled;
  },

  emitEvent: ({ eventType, userId, ts, properties = {}, correlationId, source = 'app' }) => {
    if (!eventType) throw new Error('eventType is required');
    if (!userId) throw new Error('userId is required');
    if (!MetricsService.isEnabled()) {
      return { recorded: false, reason: 'analytics_disabled' };
    }
    const event = {
      id: randomUUID(),
      eventType,
      userId,
      source,
      ts: normalizeTimestamp(ts),
      correlationId: correlationId || randomUUID(),
      properties: sanitizeProperties(properties),
    };
    Models.metricsEvents.set(event.id, event);
    appendToLog(event);
    return { recorded: true, event };
  },

  generateDailyRollups: (asOf = new Date()) => {
    const date = new Date(asOf).toISOString().split('T')[0];
    const users = collectUserIds();
    const rollups = [];
    for (const userId of users) {
      const rollup = MetricsService.buildUserDailyRollup({ userId, asOf, date });
      Models.userMetricsDaily.set(`${date}:${userId}`, rollup);
      rollups.push(rollup);
    }
    return { date, count: rollups.length, rollups };
  },

  buildUserDailyRollup: ({ userId, asOf = new Date(), date }) => {
    const asOfDate = new Date(asOf);
    const dateKey = date || asOfDate.toISOString().split('T')[0];
    const windowStart = new Date(asOfDate.getTime() - 30 * 86400000);
    const hasActiveSubscription = Array.from(Models.subscriptions.values()).some(
      sub => sub.userId === userId && sub.status === 'active',
    );
    const connectedAccounts = new Set();
    Models.plaidItems.forEach(item => {
      if (item.userId === userId) connectedAccounts.add(item.id);
    });
    Models.plaidAccounts.forEach(account => {
      if (account.userId === userId) connectedAccounts.add(account.id || account.accountId);
    });

    const transactions = Array.from(Models.plaidTransactions.values()).filter(tx => {
      if (tx.userId !== userId) return false;
      const postedAt = tx.postedAt || tx.date || tx.ts;
      const postedDate = postedAt ? new Date(postedAt) : null;
      if (!postedDate) return false;
      return postedDate >= windowStart && postedDate <= asOfDate;
    });

    const categoryCounts = {};
    let totalIncome30d = 0;
    let totalSpend30d = 0;
    for (const tx of transactions) {
      const amount = Number(tx.amount || 0);
      if (Number.isFinite(amount)) {
        if (amount >= 0) totalIncome30d += amount;
        else totalSpend30d += Math.abs(amount);
      }
      const category = categoryFromTransaction(tx);
      if (category) categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    }
    const topCategories30d = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category, count]) => ({ category, count }));

    return {
      userId,
      date: dateKey,
      activeSubscription: hasActiveSubscription,
      connectedAccountsCount: connectedAccounts.size,
      txCount30d: transactions.length,
      totalIncome30d,
      totalSpend30d,
      topCategories30d,
    };
  },

  getDailyRollup: ({ userId, date }) => {
    const dateKey = date || new Date().toISOString().split('T')[0];
    return Models.userMetricsDaily.get(`${dateKey}:${userId}`) || null;
  },
};

