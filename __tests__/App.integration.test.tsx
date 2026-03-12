import React from 'react';
import ReactTestRenderer, { ReactTestInstance } from 'react-test-renderer';
import { TouchableOpacity } from 'react-native';
import App from '../App';
import { backendClient } from '../app/services/backend';
import { analytics } from '../app/services/analytics';

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  return {
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

jest.mock('../app/services/backend', () => ({
  backendClient: {
    healthCheck: jest.fn(),
    createSubscription: jest.fn(),
    createPlaidLinkToken: jest.fn(),
    exchangePlaidPublicToken: jest.fn(),
    fetchCatalog: jest.fn(),
    fetchEntitlements: jest.fn(),
    purchase: jest.fn(),
    createPayPalSubscription: jest.fn(),
    confirmPayPalSubscription: jest.fn(),
    cancelPayPalSubscription: jest.fn(),
  },
}));

jest.mock('../app/services/analytics', () => ({
  analytics: { track: jest.fn() },
}));

const mockedBackend = backendClient as jest.Mocked<typeof backendClient>;
const mockedAnalytics = analytics as jest.Mocked<typeof analytics>;

const sampleCatalog = [
  { id: 'plan_pro', name: 'Pro Plan', description: 'Full access', price: '$9', type: 'plan' },
  { id: 'addon_insights', name: 'Insights', description: 'Addon', price: '$3', type: 'addon' },
];

const flushPromises = () => new Promise(resolve => setImmediate(resolve));

function findButtonByText(root: ReactTestInstance, text: string) {
  return root.findAllByType(TouchableOpacity).find(instance => {
    try {
      const child = instance.findByType(require('react-native').Text);
      return child.props.children === text;
    } catch {
      return false;
    }
  });
}

describe('App integration flows (mocked)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedBackend.fetchEntitlements.mockResolvedValue({ entitlements: [] });
    mockedBackend.fetchCatalog.mockResolvedValue({ products: sampleCatalog });
    mockedBackend.purchase.mockResolvedValue({ entitlement: { id: 'ent_1' } });
    mockedBackend.confirmPayPalSubscription.mockResolvedValue({});
    mockedAnalytics.track.mockResolvedValue?.();
  });

  test('app renders without crashing', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<App />);
      await flushPromises();
    });

    expect(renderer).toBeDefined();
  });

  test('backend services are called on mount', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<App />);
      await flushPromises();
    });

    expect(mockedBackend.fetchEntitlements).toHaveBeenCalled();
    expect(mockedAnalytics.track).toHaveBeenCalledWith({ name: 'app_viewed' });
  });

  test('money generator title is displayed', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<App />);
      await flushPromises();
    });

    const title = (renderer as any).root.findAllByProps({ children: 'Money Generator' });
    expect(title.length).toBeGreaterThan(0);
  });
});
