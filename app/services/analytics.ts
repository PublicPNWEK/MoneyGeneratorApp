type AnalyticsEvent = {
  name: string;
  correlationId?: string;
  payload?: Record<string, unknown>;
};

export const analytics = {
  track: ({ name, correlationId, payload }: AnalyticsEvent) => {
    const event = {
      name,
      correlationId: correlationId || `${Date.now()}`,
      ...payload,
    };
    // Placeholder: wire to real analytics provider
    console.log('analytics_event', event);
  },
};
