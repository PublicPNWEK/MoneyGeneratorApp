import crypto from 'crypto';
import { v4 as uuid } from 'uuid';
import { EventStatus, Models } from './models.js';

const {
  PAYPAL_WEBHOOK_SECRET = 'demo-paypal-secret',
  PLAID_WEBHOOK_SECRET = 'demo-plaid-secret',
} = process.env;

const STATUS = {
  ACTIVE: 'active',
  PENDING: 'pending',
  CANCELED: 'canceled',
};

function signPayload(secret, body) {
  return crypto.createHmac('sha256', secret).update(body).digest('hex');
}

function verifySignature(secret, body, signature) {
  const expected = signPayload(secret, body);
  const normalizedBody = safeNormalize(body);
  const normalizedExpected = normalizedBody ? signPayload(secret, normalizedBody) : expected;
  const provided = signature || '';
  const matches = compare(expected, provided) || compare(normalizedExpected, provided);
  return matches;
}

function compare(expected, provided) {
  if (!expected || expected.length !== provided.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(provided));
}

function safeNormalize(body) {
  try {
    const parsed = JSON.parse(body);
    return JSON.stringify(parsed);
  } catch {
    return null;
  }
}

function recordEvent(id, provider, body, correlationId) {
  if (Models.webhookEvents.has(id)) {
    return { status: EventStatus.DUPLICATE, event: Models.webhookEvents.get(id) };
  }
  const event = {
    id,
    provider,
    body,
    correlationId,
    createdAt: new Date().toISOString(),
    status: EventStatus.PROCESSED,
  };
  Models.webhookEvents.set(id, event);
  return { status: EventStatus.PROCESSED, event };
}

function emitInternalEvent(type, payload, log) {
  Models.metrics.increment(`event.${type}`);
  log?.info('internal_event', { type, payload });
}

function enqueueOutboundWebhook(event) {
  Models.outboundWebhookQueue.push({ ...event, attempts: 0, status: 'queued' });
}

async function dispatchOutboundWebhooks(log) {
  const queue = Models.outboundWebhookQueue;
  for (const job of queue) {
    if (job.status === 'delivered') continue;
    try {
      job.attempts += 1;
      // Simulated delivery; in production use fetch/axios to post to CRM URLs
      job.status = 'delivered';
      job.deliveredAt = new Date().toISOString();
      emitInternalEvent('outbound_webhook.delivered', { id: job.id }, log);
    } catch (e) {
      job.status = 'failed';
      job.error = e.message;
      if (job.attempts < 5) {
        const delay = Math.min(30000, 1000 * 2 ** job.attempts);
        job.retryAt = Date.now() + delay;
      }
    }
  }
}

export const IntegrationService = {
  createSubscription: ({ userId, planId }) => {
    const subId = uuid();
    Models.subscriptions.set(subId, {
      id: subId,
      userId,
      planId,
      status: 'active',
    });
    Models.entitlements.set(subId, { id: subId, userId, planId, active: true });
    return { id: subId, status: 'active' };
  },

  createEntitlement: ({ userId, productId, kind, durationDays = 30 }) => {
    const id = uuid();
    const effectiveAt = new Date();
    const expiresAt =
      kind === 'one_time' ? null : new Date(effectiveAt.getTime() + durationDays * 86400000);
    const record = {
      id,
      userId,
      productId,
      kind,
      effectiveAt: effectiveAt.toISOString(),
      expiresAt: expiresAt ? expiresAt.toISOString() : null,
      createdAt: new Date().toISOString(),
    };
    Models.entitlements.set(id, record);
    Models.auditLog.push({ type: 'entitlement_created', record });
    Models.metrics.increment('entitlements.created');
    return record;
  },

  createPayPalSubscription: ({ userId, planId }) => {
    const providerSubscriptionId = `paypal-${uuid()}`;
    const approvalUrl = `https://paypal.example/approve/${providerSubscriptionId}`;
    const sub = {
      id: uuid(),
      provider: 'paypal',
      providerSubscriptionId,
      status: STATUS.PENDING,
      planId,
      startedAt: null,
      canceledAt: null,
      currentPeriodEnd: null,
      userId,
    };
    Models.subscriptions.set(sub.id, sub);
    Models.auditLog.push({ type: 'subscription_created', sub });
    Models.subscriptionEvents.set(providerSubscriptionId, sub.id);
    return { approvalUrl, subscriptionId: sub.id, providerSubscriptionId };
  },

  confirmPayPalSubscription: ({ providerSubscriptionId, userId }) => {
    const id = Models.subscriptionEvents.get(providerSubscriptionId);
    if (!id) throw new Error('unknown_subscription');
    const sub = Models.subscriptions.get(id);
    if (sub.status === STATUS.CANCELED) throw new Error('invalid_transition');
    sub.status = STATUS.ACTIVE;
    sub.startedAt = new Date().toISOString();
    sub.currentPeriodEnd = new Date(Date.now() + 30 * 86400000).toISOString();
    Models.auditLog.push({ type: 'subscription_activated', sub });
    enqueueOutboundWebhook({
      id: uuid(),
      type: 'subscription.updated',
      payload: { subscriptionId: id, status: sub.status, provider: 'paypal', userId },
    });
    return sub;
  },

  cancelPayPalSubscription: ({ providerSubscriptionId }) => {
    const id = Models.subscriptionEvents.get(providerSubscriptionId);
    if (!id) throw new Error('unknown_subscription');
    const sub = Models.subscriptions.get(id);
    if (sub.status === STATUS.CANCELED) return sub;
    sub.status = STATUS.CANCELED;
    sub.canceledAt = new Date().toISOString();
    Models.auditLog.push({ type: 'subscription_canceled', sub });
    enqueueOutboundWebhook({
      id: uuid(),
      type: 'subscription.updated',
      payload: { subscriptionId: id, status: sub.status, provider: 'paypal', userId: sub.userId },
    });
    return sub;
  },

  verifyAndProcessPayPalWebhook: (rawBody, signature, log, correlationId) => {
    if (!verifySignature(PAYPAL_WEBHOOK_SECRET, rawBody, signature)) {
      throw new Error('invalid_signature');
    }
    const payload = JSON.parse(rawBody);
    const eventId = payload.id || payload.event_id || uuid();
    const result = recordEvent(eventId, 'paypal', payload, correlationId);
    if (result.status === EventStatus.DUPLICATE) return result;

    // Simulated state handling
    if (payload.resource?.status === 'ACTIVE') {
      IntegrationService.confirmPayPalSubscription({
        providerSubscriptionId: payload.resource.id,
        userId: payload.resource.custom_id || 'demo-user',
      });
    }
    emitInternalEvent('paypal.webhook', { id: eventId, type: payload.event_type }, log);
    enqueueOutboundWebhook({
      id: uuid(),
      type: 'subscription.updated',
      payload: {
        eventId,
        provider: 'paypal',
        status: payload.resource?.status,
        providerSubscriptionId: payload.resource?.id,
      },
    });
    return result;
  },

  verifyAndProcessPlaidWebhook: (rawBody, signature, log, correlationId) => {
    if (!verifySignature(PLAID_WEBHOOK_SECRET, rawBody, signature)) {
      throw new Error('invalid_signature');
    }
    const payload = JSON.parse(rawBody);
    const eventId = payload.webhook_code ? `${payload.webhook_code}-${payload.item_id}` : uuid();
    const result = recordEvent(eventId, 'plaid', payload, correlationId);
    if (result.status === EventStatus.DUPLICATE) return result;

    emitInternalEvent('plaid.webhook', { code: payload.webhook_code, itemId: payload.item_id }, log);
    return result;
  },

  getMetrics: () => Models.metrics.counters,
  dispatchOutboundWebhooks,
};
