import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { backendClient } from './app/services/backend';
import { useEntitlements } from './app/hooks/useEntitlements';
import { analytics } from './app/services/analytics';

type Product = {
  id: string;
  type: string;
  name: string;
  price: string;
  description: string;
};

type Theme = typeof lightTheme;

const catalogFallback: Product[] = [
  {
    id: 'plan_pro',
    type: 'plan',
    name: 'Pro Plan',
    price: '$14.99/mo',
    description: 'Advanced analytics, instant payouts, and automation.',
  },
  {
    id: 'addon_shift_insights',
    type: 'addon',
    name: 'Shift Insights',
    price: '$4.99/mo',
    description: 'Per-shift profitability and mileage rollups.',
  },
  {
    id: 'onetime_boost',
    type: 'one_time',
    name: 'Boost Pack',
    price: '$19.99',
    description: 'Priority placement for 14 days.',
  },
];

const financeOverview = [
  {
    title: 'Financial Liquidity',
    description: 'EarnIn-style advances with configurable limits (up to $150/day).',
    bullets: ['Instant payout rails', 'Eligibility scoring per provider', 'Transparent fees + markup'],
  },
  {
    title: 'Benefits Safety Net',
    description: 'Catch-style tax withholding, health, retirement, and rainy-day buckets.',
    bullets: ['Auto-reserve % of earnings', 'Portable benefits per gig', 'Audit-ready receipts'],
  },
  {
    title: 'Expense Intelligence',
    description: 'Expensify-grade receipt scanning and mileage logging.',
    bullets: ['Card-level enrichment', 'Policy rules by tier', 'CSV + API exports'],
  },
];

const metrics = [
  { label: 'Market Trajectory', value: '$2.1T gig economy by 2034' },
  { label: 'Coverage', value: '20+ partner APIs' },
  { label: 'Payout latency', value: '< 60s to card' },
];

const lightTheme = {
  background: '#F5F6F8',
  card: '#FFFFFF',
  text: '#0B1222',
  subtle: '#4B5563',
  border: '#E5E7EB',
  accent: '#7C3AED',
  accentSoft: '#EDE9FE',
};

const darkTheme = {
  background: '#0B1222',
  card: '#11182B',
  text: '#F8FAFC',
  subtle: '#AAB3C5',
  border: '#1F2937',
  accent: '#A78BFA',
  accentSoft: '#1E1B4B',
};

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent() {
  const isDarkMode = useColorScheme() === 'dark';
  const theme = isDarkMode ? darkTheme : lightTheme;
  const safeAreaInsets = useSafeAreaInsets();

  const [screen, setScreen] = React.useState<'home' | 'shop' | 'planDetails' | 'checkout' | 'success'>(
    'home',
  );
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null);
  const [checkoutStatus, setCheckoutStatus] = React.useState<'idle' | 'loading' | 'error'>('idle');
  const [catalog, setCatalog] = React.useState<Product[]>([]);
  const [catalogLoading, setCatalogLoading] = React.useState(false);
  const [catalogError, setCatalogError] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);
  const [approvalUrl, setApprovalUrl] = React.useState<string | null>(null);
  const [providerSubscriptionId, setProviderSubscriptionId] = React.useState<string | null>(null);
  const { entitlements, loading: entitlementsLoading, refresh: refreshEntitlements } = useEntitlements();

  const products = catalog.length ? catalog : catalogFallback;

  const loadCatalog = React.useCallback(async () => {
    try {
      setCatalogLoading(true);
      setCatalogError(null);
      const data = await backendClient.fetchCatalog();
      setCatalog(data.products || []);
    } catch (err: any) {
      setCatalogError(err.message || 'Failed to load catalog');
    } finally {
      setCatalogLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (screen === 'shop' || screen === 'planDetails') {
      loadCatalog();
      analytics.track({ name: `${screen}_viewed` });
    }
  }, [screen, loadCatalog]);

  const startCheckout = async (product: Product) => {
    setSelectedProduct(product);
    setCheckoutStatus('loading');
    setMessage(null);
    analytics.track({ name: 'checkout_started', payload: { productId: product.id } });
    try {
      await backendClient.purchase(product.id, 'demo-user');
      await refreshEntitlements();
      setCheckoutStatus('idle');
      setScreen('success');
      setMessage('Purchase completed and entitlements updated.');
      analytics.track({ name: 'purchase_completed', payload: { productId: product.id } });
    } catch (err: any) {
      setCheckoutStatus('error');
      setMessage(err.message || 'Checkout failed. Please retry.');
    }
  };

  const startPayPalFlow = async (product: Product) => {
    const res = await backendClient.createPayPalSubscription('demo-user', product.id);
    setSelectedProduct(product);
    setApprovalUrl(res.approvalUrl);
    setProviderSubscriptionId(res.providerSubscriptionId);
    setScreen('planDetails');
  };

  const confirmPayPal = async () => {
    if (!providerSubscriptionId) return;
    setCheckoutStatus('loading');
    try {
      await backendClient.confirmPayPalSubscription(providerSubscriptionId, 'demo-user');
      await refreshEntitlements();
      setCheckoutStatus('idle');
      setScreen('success');
      setMessage('Subscription activated via PayPal.');
    } catch (err: any) {
      setCheckoutStatus('error');
      setMessage(err.message || 'Approval failed. Retry.');
    }
  };

  return (
    <View
      style={[
        styles.screen,
        {
          backgroundColor: theme.background,
          paddingTop: safeAreaInsets.top,
          paddingBottom: safeAreaInsets.bottom,
        },
      ]}
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.title, { color: theme.text }]}>Money Generator OS</Text>
          <Text style={[styles.subtitle, { color: theme.subtle }]}>
            Build once, deploy everywhere. A single control center for earning, managing, and thriving.
          </Text>
          <View style={styles.ctaRow}>
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: theme.accent }]}
              onPress={() => setScreen('shop')}
              activeOpacity={0.9}
            >
              <Text style={styles.primaryButtonText}>Open Shop</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: theme.border }]}
              onPress={() => setScreen('planDetails')}
              activeOpacity={0.9}
            >
              <Text style={[styles.secondaryButtonText, { color: theme.text }]}>Settings → Billing</Text>
            </TouchableOpacity>
          </View>
        </View>

        <MetricStrip theme={theme} />
        <FinanceOverview theme={theme} />
      </ScrollView>

      {screen === 'shop' ? (
        <ShopOverlay
          theme={theme}
          catalog={products}
          loading={catalogLoading}
          error={catalogError}
          onBack={() => setScreen('home')}
          onRetry={loadCatalog}
          onSelect={product => {
            analytics.track({ name: 'plan_selected', payload: { productId: product.id } });
            setSelectedProduct(product);
            setScreen('checkout');
          }}
        />
      ) : null}

      {screen === 'planDetails' ? (
        <PlanDetailsOverlay
          theme={theme}
          catalog={products.filter(item => item.type === 'plan')}
          loading={catalogLoading}
          error={catalogError}
          onBack={() => setScreen('home')}
          onRetry={loadCatalog}
          onCheckout={product => {
            setSelectedProduct(product);
            setScreen('checkout');
          }}
          onStartPayPal={startPayPalFlow}
          approvalUrl={approvalUrl}
          onConfirmPayPal={confirmPayPal}
          checkoutStatus={checkoutStatus}
          message={message}
        />
      ) : null}

      {screen === 'checkout' && selectedProduct ? (
        <CheckoutOverlay
          theme={theme}
          product={selectedProduct}
          status={checkoutStatus}
          message={message}
          onConfirm={() => startCheckout(selectedProduct)}
          onCancel={() => setScreen('shop')}
        />
      ) : null}

      {screen === 'success' ? (
        <SuccessOverlay
          theme={theme}
          entitlements={entitlements}
          loading={entitlementsLoading}
          message={message}
          onClose={() => setScreen('home')}
        />
      ) : null}
    </View>
  );
}

function MetricStrip({ theme }: { theme: Theme }) {
  return (
    <View style={styles.metricStrip}>
      {metrics.map(item => (
        <View
          key={item.label}
          style={[
            styles.metricCard,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
        >
          <Text style={[styles.metricLabel, { color: theme.subtle }]}>{item.label}</Text>
          <Text style={[styles.metricValue, { color: theme.text }]}>{item.value}</Text>
        </View>
      ))}
    </View>
  );
}

function FinanceOverview({ theme }: { theme: Theme }) {
  return (
    <View style={styles.financeGrid}>
      {financeOverview.map(item => (
        <View
          key={item.title}
          style={[
            styles.financeCard,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
        >
          <Text style={[styles.cardTitle, { color: theme.text }]}>{item.title}</Text>
          <Text style={[styles.cardDescription, { color: theme.subtle }]}>{item.description}</Text>
          {item.bullets.map(bullet => (
            <View key={bullet} style={styles.bulletRow}>
              <View style={[styles.bulletDot, { backgroundColor: theme.accent }]} />
              <Text style={[styles.bulletText, { color: theme.subtle }]}>{bullet}</Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

type OverlayProps = {
  theme: Theme;
  onBack: () => void;
};

type ShopProps = OverlayProps & {
  catalog: Product[];
  loading: boolean;
  error: string | null;
  onSelect: (product: Product) => void;
  onRetry: () => void;
};

function ShopOverlay({ theme, catalog, loading, error, onSelect, onBack, onRetry }: ShopProps) {
  return (
    <View style={[styles.overlay, { backgroundColor: theme.background }]}>
      <View style={styles.overlayHeader}>
        <Text style={[styles.overlayTitle, { color: theme.text }]}>Embedded Shop</Text>
        <TouchableOpacity onPress={onBack}>
          <Text style={[styles.secondaryButtonText, { color: theme.text }]}>Close</Text>
        </TouchableOpacity>
      </View>
      {loading && <ActivityIndicator color={theme.accent} />}
      {error && (
        <View style={styles.alert}>
          <Text style={[styles.cardDescription, { color: theme.text }]}>{error}</Text>
          <Pressable onPress={onRetry}>
            <Text style={[styles.secondaryButtonText, { color: theme.accent }]}>Retry</Text>
          </Pressable>
        </View>
      )}
      <ScrollView contentContainerStyle={styles.overlayContent}>
        {catalog.map(product => (
          <Pressable
            key={product.id}
            onPress={() => onSelect(product)}
            style={[
              styles.overlayCard,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>{product.name}</Text>
              <Text style={[styles.pill, { color: theme.text }]}>{product.price}</Text>
            </View>
            <Text style={[styles.cardDescription, { color: theme.subtle }]}>
              {product.description}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

type PlanProps = OverlayProps & {
  catalog: Product[];
  loading: boolean;
  error: string | null;
  onCheckout: (product: Product) => void;
  onRetry: () => void;
  onStartPayPal: (product: Product) => Promise<void>;
  approvalUrl: string | null;
  onConfirmPayPal: () => Promise<void>;
  checkoutStatus: 'idle' | 'loading' | 'error';
  message: string | null;
};

function PlanDetailsOverlay({
  theme,
  catalog,
  loading,
  error,
  onCheckout,
  onBack,
  onRetry,
  onStartPayPal,
  approvalUrl,
  onConfirmPayPal,
  checkoutStatus,
  message,
}: PlanProps) {
  return (
    <View style={[styles.overlay, { backgroundColor: theme.background }]}>
      <View style={styles.overlayHeader}>
        <Text style={[styles.overlayTitle, { color: theme.text }]}>Subscription Plans</Text>
        <TouchableOpacity onPress={onBack}>
          <Text style={[styles.secondaryButtonText, { color: theme.text }]}>Back</Text>
        </TouchableOpacity>
      </View>
      {loading && <ActivityIndicator color={theme.accent} />}
      {error && (
        <View style={styles.alert}>
          <Text style={[styles.cardDescription, { color: theme.text }]}>{error}</Text>
          <Pressable onPress={onRetry}>
            <Text style={[styles.secondaryButtonText, { color: theme.accent }]}>Retry</Text>
          </Pressable>
        </View>
      )}
      <ScrollView contentContainerStyle={styles.overlayContent}>
        {catalog.map(plan => (
          <View
            key={plan.id}
            style={[
              styles.overlayCard,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>{plan.name}</Text>
              <Text style={[styles.pill, { color: theme.text }]}>{plan.price}</Text>
            </View>
            <Text style={[styles.cardDescription, { color: theme.subtle }]}>{plan.description}</Text>
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: theme.accent }]}
              onPress={() => onCheckout(plan)}
            >
              <Text style={styles.primaryButtonText}>Select</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: theme.border }]}
              onPress={() => onStartPayPal(plan)}
            >
              <Text style={[styles.secondaryButtonText, { color: theme.text }]}>
                Start PayPal Flow
              </Text>
            </TouchableOpacity>
          </View>
        ))}

        {approvalUrl ? (
          <View
            style={[
              styles.overlayCard,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <Text style={[styles.cardTitle, { color: theme.text }]}>PayPal Approval</Text>
            <Text style={[styles.cardDescription, { color: theme.subtle }]}>{approvalUrl}</Text>
            {message ? (
              <Text style={[styles.cardDescription, { color: theme.subtle }]}>{message}</Text>
            ) : null}
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: theme.accent }]}
              onPress={onConfirmPayPal}
              disabled={checkoutStatus === 'loading'}
            >
              <Text style={styles.primaryButtonText}>Confirm PayPal Subscription</Text>
            </TouchableOpacity>
            {checkoutStatus === 'loading' ? <ActivityIndicator color={theme.accent} /> : null}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

type CheckoutProps = {
  theme: Theme;
  product: Product;
  status: 'idle' | 'loading' | 'error';
  message: string | null;
  onConfirm: () => void;
  onCancel: () => void;
};

function CheckoutOverlay({ theme, product, status, message, onConfirm, onCancel }: CheckoutProps) {
  return (
    <View style={[styles.overlay, { backgroundColor: theme.background }]}>
      <View style={styles.overlayHeader}>
        <Text style={[styles.overlayTitle, { color: theme.text }]}>Checkout</Text>
        <TouchableOpacity onPress={onCancel}>
          <Text style={[styles.secondaryButtonText, { color: theme.text }]}>Cancel</Text>
        </TouchableOpacity>
      </View>
      <View style={[styles.overlayCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>{product.name}</Text>
        <Text style={[styles.cardDescription, { color: theme.subtle }]}>{product.description}</Text>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>{product.price}</Text>
        {message ? <Text style={[styles.cardDescription, { color: theme.subtle }]}>{message}</Text> : null}
        {status === 'loading' ? (
          <ActivityIndicator color={theme.accent} />
        ) : (
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: theme.accent }]}
            onPress={onConfirm}
          >
            <Text style={styles.primaryButtonText}>Confirm Purchase</Text>
          </TouchableOpacity>
        )}
        {status === 'error' ? (
          <Pressable onPress={onConfirm}>
            <Text style={[styles.secondaryButtonText, { color: theme.accent }]}>Retry</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

type SuccessProps = {
  theme: Theme;
  entitlements: any[];
  loading: boolean;
  message: string | null;
  onClose: () => void;
};

function SuccessOverlay({ theme, entitlements, loading, message, onClose }: SuccessProps) {
  return (
    <View style={[styles.overlay, { backgroundColor: theme.background }]}>
      <View style={styles.overlayHeader}>
        <Text style={[styles.overlayTitle, { color: theme.text }]}>Purchase Success</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={[styles.secondaryButtonText, { color: theme.text }]}>Close</Text>
        </TouchableOpacity>
      </View>
      {message ? <Text style={[styles.cardDescription, { color: theme.subtle }]}>{message}</Text> : null}
      {loading ? (
        <ActivityIndicator color={theme.accent} />
      ) : (
        <View style={{ gap: 8 }}>
          {entitlements.map(item => (
            <View
              key={item.id}
              style={[
                styles.bulletRow,
                {
                  padding: 10,
                  borderRadius: 10,
                  backgroundColor: theme.card,
                  borderWidth: 1,
                  borderColor: theme.border,
                },
              ]}
            >
              <View style={[styles.bulletDot, { backgroundColor: theme.accent }]} />
              <Text style={[styles.cardDescription, { color: theme.text }]}>{item.productId}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 20,
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  ctaRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  primaryButton: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },
  primaryButtonText: {
    color: '#0B1222',
    fontWeight: '700',
    fontSize: 15,
  },
  secondaryButton: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontWeight: '700',
    fontSize: 15,
  },
  metricStrip: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  metricCard: {
    flex: 1,
    minWidth: 160,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  financeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  financeCard: {
    flex: 1,
    minWidth: 260,
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  cardDescription: {
    fontSize: 13,
    lineHeight: 19,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
  },
  bulletText: {
    fontSize: 13,
    lineHeight: 19,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 20,
    gap: 12,
  },
  overlayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  overlayTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  overlayContent: {
    paddingBottom: 60,
    gap: 12,
  },
  overlayCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },
  pill: {
    fontWeight: '700',
  },
  alert: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
});

export default App;
