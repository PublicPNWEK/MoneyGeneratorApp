import crypto from 'crypto';
import { IntegrationService } from '../integrationService.js';
import { Models } from '../models.js';

const paypalSecret = 'demo-paypal-secret';
const plaidSecret = 'demo-plaid-secret';

const sign = (secret, body) => crypto.createHmac('sha256', secret).update(body).digest('hex');

describe('webhook verification and idempotency', () => {
  beforeAll(async () => {
    process.env.PAYPAL_WEBHOOK_SECRET = paypalSecret;
    process.env.PLAID_WEBHOOK_SECRET = plaidSecret;
  });

  beforeEach(() => {
    Models.webhookEvents.clear();
  });

  test('rejects invalid PayPal signature', async () => {
    const payload = JSON.stringify({ id: 'evt_1', event_type: 'PAYMENT.SALE.COMPLETED' });
    expect(() =>
      IntegrationService.verifyAndProcessPayPalWebhook(payload, 'bad', console, 'corr-invalid'),
    ).toThrow('invalid_signature');
  });

  test('processes PayPal webhook idempotently', async () => {
    const payload = JSON.stringify({ id: 'evt_1', event_type: 'PAYMENT.SALE.COMPLETED' });
    const signature = await sign(paypalSecret, payload);

    const first = IntegrationService.verifyAndProcessPayPalWebhook(
      payload,
      signature,
      console,
      'corr-1',
    );
    expect(first.status).toBe('processed');

    const second = IntegrationService.verifyAndProcessPayPalWebhook(
      payload,
      signature,
      console,
      'corr-2',
    );
    expect(second.status).toBe('duplicate');
  });

  test('processes Plaid webhook idempotently', async () => {
    const payload = JSON.stringify({ webhook_code: 'SYNC_UPDATES_AVAILABLE', item_id: 'item_1' });
    const signature = await sign(plaidSecret, payload);

    const first = IntegrationService.verifyAndProcessPlaidWebhook(
      payload,
      signature,
      console,
      'corr-3',
    );
    expect(first.status).toBe('processed');

    const second = IntegrationService.verifyAndProcessPlaidWebhook(
      payload,
      signature,
      console,
      'corr-4',
    );
    expect(second.status).toBe('duplicate');
  });
});
