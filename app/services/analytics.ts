import { backendClient } from './backend';

type AnalyticsEvent = {
  name?: string;
  eventType?: string;
  correlationId?: string;
  payload?: Record<string, unknown>;
};

let analyticsEnabled = process.env.ANALYTICS_ENABLED !== 'false';

export const analytics = {
  track: async ({ name, eventType, correlationId, payload }: AnalyticsEvent) => {
    if (!analyticsEnabled) return;
    const resolvedEventType = eventType || name;
    if (!resolvedEventType) return;
    const event = {
      eventType: resolvedEventType,
      correlationId: correlationId || `${Date.now()}`,
      ...payload,
    };
    // Placeholder: wire to real analytics provider
    console.log('analytics_event', event);
    try {
      await backendClient.recordMetricsEvent({
        eventType: resolvedEventType,
        userId: 'demo-user',
        properties: payload,
        correlationId: event.correlationId,
        source: 'app_ui',
      });
    } catch (err: any) {
      console.warn('analytics_event_failed', err?.message || err);
    }
  },
  setEnabled: (enabled: boolean) => {
    analyticsEnabled = enabled;
  },
  isEnabled: () => analyticsEnabled,
};
