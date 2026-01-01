import { MetricsService } from '../metrics.js';
import { Models } from '../models.js';

describe('MetricsService', () => {
  beforeEach(() => {
    Models.metricsEvents.clear();
    Models.userMetricsDaily.clear();
    Models.subscriptions.clear();
    Models.plaidItems.clear();
    Models.plaidAccounts.clear();
    Models.plaidTransactions.clear();
    Models.settings.analyticsEnabled = true;
  });

  test('records events with sanitization and correlation id', () => {
    const result = MetricsService.emitEvent({
      eventType: 'shop.viewed',
      userId: 'user-1',
      ts: '2024-01-01T00:00:00Z',
      properties: { description: 'sensitive merchant name', productId: 'pro' },
      correlationId: 'corr-123',
      source: 'app_ui',
    });

    expect(result.recorded).toBe(true);
    expect(Models.metricsEvents.size).toBe(1);
    const stored = Array.from(Models.metricsEvents.values())[0];
    expect(stored.correlationId).toBe('corr-123');
    expect(stored.properties.productId).toBe('pro');
    expect(stored.properties.description).toBeUndefined();
  });

  test('rolls up daily metrics with subscription and transaction data', () => {
    Models.subscriptions.set('sub-1', {
      id: 'sub-1',
      userId: 'user-2',
      planId: 'plan_pro',
      status: 'active',
    });
    Models.plaidItems.set('item-1', { id: 'item-1', userId: 'user-2' });
    const now = new Date();
    const recentDate = new Date(now.getTime() - 5 * 86400000).toISOString();
    Models.plaidTransactions.set('tx-1', {
      id: 'tx-1',
      userId: 'user-2',
      amount: 120,
      category: 'income',
      postedAt: recentDate,
    });
    Models.plaidTransactions.set('tx-2', {
      id: 'tx-2',
      userId: 'user-2',
      amount: -45.5,
      categories: ['transport'],
      postedAt: recentDate,
    });

    const { date } = MetricsService.generateDailyRollups(now);
    const rollup = MetricsService.getDailyRollup({ userId: 'user-2', date });
    expect(rollup.activeSubscription).toBe(true);
    expect(rollup.connectedAccountsCount).toBe(1);
    expect(rollup.txCount30d).toBe(2);
    expect(rollup.totalIncome30d).toBeCloseTo(120);
    expect(rollup.totalSpend30d).toBeCloseTo(45.5);
    expect(rollup.topCategories30d.find(cat => cat.category === 'income')?.count).toBe(1);
    expect(rollup.topCategories30d.find(cat => cat.category === 'transport')?.count).toBe(1);
  });
});

