import crypto from 'crypto';
import request from 'supertest';
import app from '../app.js';
import { Models } from '../models.js';

const paypalSecret = 'demo-paypal-secret';
const plaidSecret = 'demo-plaid-secret';

const sign = (secret, body) => crypto.createHmac('sha256', secret).update(body).digest('hex');

function resetModels() {
  Models.webhookEvents.clear();
  Models.outboundWebhookQueue.length = 0;
  Models.subscriptions.clear();
  Models.subscriptionEvents.clear();
  Models.entitlements.clear();
  Models.auditLog.length = 0;
  Models.metrics.counters = {};
}

describe('integration smoke flows', () => {
  beforeEach(() => {
    resetModels();
  });

  test('processes PayPal webhook idempotently over HTTP', async () => {
    const payload = {
      id: 'evt_paypal_123',
      event_type: 'PAYMENT.SALE.COMPLETED',
    };
    const rawBody = JSON.stringify(payload);
    const signature = sign(paypalSecret, rawBody);

    const first = await request(app)
      .post('/webhooks/paypal')
      .set('Content-Type', 'application/json')
      .set('x-paypal-signature', signature)
      .send(rawBody);

    expect(first.status).toBe(200);
    expect(first.body.status).toBe('processed');

    const second = await request(app)
      .post('/webhooks/paypal')
      .set('Content-Type', 'application/json')
      .set('x-paypal-signature', signature)
      .send(rawBody);

    expect(second.status).toBe(200);
    expect(second.body.status).toBe('duplicate');
  });

  test('transitions subscription lifecycle across endpoints', async () => {
    const create = await request(app)
      .post('/billing/paypal/subscription/create')
      .send({ userId: 'demo-user', planId: 'plan_pro' });

    expect(create.status).toBe(200);
    expect(create.body.providerSubscriptionId).toBeTruthy();

    const providerSubscriptionId = create.body.providerSubscriptionId;
    const subscriptionId = create.body.subscriptionId;
    expect(Models.subscriptions.get(subscriptionId)?.status).toBe('pending');

    const confirm = await request(app)
      .post('/billing/paypal/subscription/confirm')
      .send({ providerSubscriptionId, userId: 'demo-user' });

    expect(confirm.status).toBe(200);
    expect(confirm.body.subscription.status).toBe('active');
    expect(confirm.body.entitlement.productId).toBe('plan_pro');

    const cancel = await request(app)
      .post('/billing/paypal/subscription/cancel')
      .send({ providerSubscriptionId });

    expect(cancel.status).toBe(200);
    expect(cancel.body.subscription.status).toBe('canceled');
  });

  test('deduplicates Plaid sync webhook notifications', async () => {
    const payload = {
      webhook_code: 'SYNC_UPDATES_AVAILABLE',
      item_id: 'item_demo_1',
    };
    const rawBody = JSON.stringify(payload);
    const signature = sign(plaidSecret, rawBody);

    const first = await request(app)
      .post('/webhooks/plaid')
      .set('Content-Type', 'application/json')
      .set('x-plaid-signature', signature)
      .send(rawBody);

    expect(first.status).toBe(200);
    expect(first.body.status).toBe('processed');

    const second = await request(app)
      .post('/webhooks/plaid')
      .set('Content-Type', 'application/json')
      .set('x-plaid-signature', signature)
      .send(rawBody);

    expect(second.status).toBe(200);
    expect(second.body.status).toBe('duplicate');
  });
});
