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

  test('shop loads catalog from backend', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<App />);
      await flushPromises();
    });

    const openShop = findButtonByText((renderer as any).root, 'Open Shop');
    expect(openShop).toBeDefined();

    await ReactTestRenderer.act(async () => {
      openShop?.props.onPress();
      await flushPromises();
    });

    expect(mockedBackend.fetchCatalog).toHaveBeenCalled();
    const productNames = (renderer as any).root.findAllByProps({ children: 'Pro Plan' });
    expect(productNames.length).toBeGreaterThan(0);
  });

  test('subscription checkout flow triggers purchase and entitlement refresh', async () => {
    mockedBackend.fetchEntitlements
      .mockResolvedValueOnce({ entitlements: [] })
      .mockResolvedValueOnce({
        entitlements: [{ id: 'ent_2', productId: 'plan_pro', effectiveAt: '2024-01-01' }],
      });

    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<App />);
      await flushPromises();
    });

    const billingButton = findButtonByText((renderer as any).root, 'Settings → Billing');
    expect(billingButton).toBeDefined();

    await ReactTestRenderer.act(async () => {
      billingButton?.props.onPress();
      await flushPromises();
    });

    const selectButton = findButtonByText((renderer as any).root, 'Select');
    expect(selectButton).toBeDefined();

    await ReactTestRenderer.act(async () => {
      selectButton?.props.onPress();
      await flushPromises();
    });

    const confirmButton = findButtonByText((renderer as any).root, 'Confirm Purchase');
    expect(confirmButton).toBeDefined();

    await ReactTestRenderer.act(async () => {
      confirmButton?.props.onPress();
      await flushPromises();
    });

    expect(mockedBackend.purchase).toHaveBeenCalledWith('plan_pro', 'demo-user');
    expect(mockedBackend.fetchEntitlements).toHaveBeenCalledTimes(2);
  });

  test('finance overview renders', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<App />);
      await flushPromises();
    });

    const financeCards = (renderer as any).root.findAllByProps({ children: 'Financial Liquidity' });
    expect(financeCards.length).toBeGreaterThan(0);

    const metrics = (renderer as any).root.findAllByProps({ children: 'Market Trajectory' });
    expect(metrics.length).toBeGreaterThan(0);
  });
});
