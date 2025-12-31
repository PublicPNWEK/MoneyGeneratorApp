import React from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  ActivityIndicator,
  Pressable,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { backendClient } from './app/services/backend';
import { useEntitlements } from './app/hooks/useEntitlements';
import { analytics } from './app/services/analytics';

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
  const safeAreaInsets = useSafeAreaInsets();
  const isDarkMode = useColorScheme() === 'dark';
  const theme = isDarkMode ? darkTheme : lightTheme;
  const [screen, setScreen] = React.useState<
    'home' | 'shop' | 'planDetails' | 'checkout' | 'success'
  >('home');
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null);
  const [checkoutStatus, setCheckoutStatus] = React.useState<'idle' | 'loading' | 'error'>('idle');
  const [catalog, setCatalog] = React.useState<Product[]>([]);
  const [catalogLoading, setCatalogLoading] = React.useState(false);
  const [catalogError, setCatalogError] = React.useState<string | null>(null);
  const { entitlements, loading: entitlementsLoading, refresh: refreshEntitlements } = useEntitlements();
  const [message, setMessage] = React.useState<string | null>(null);
  const [approvalUrl, setApprovalUrl] = React.useState<string | null>(null);
  const [providerSubscriptionId, setProviderSubscriptionId] = React.useState<string | null>(null);

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
    if (screen !== 'home') {
      loadCatalog();
      analytics.track({ name: 'shop_viewed' });
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
      analytics.track({ name: 'purchase_completed', payload: { productId: product.id } });
      setScreen('success');
      setMessage('Purchase completed and entitlements updated.');
    } catch (err: any) {
      setCheckoutStatus('error');
      setMessage(err.message || 'Checkout failed. Please retry.');
    }
  };

  const renderBody = () => {
    if (screen === 'shop') {
      return (
        <ShopScreen
          theme={theme}
          catalog={catalog}
          loading={catalogLoading}
          error={catalogError}
          onSelect={product => {
            analytics.track({ name: 'plan_selected', payload: { productId: product.id } });
            setSelectedProduct(product);
            setScreen('checkout');
          }}
          onBack={() => setScreen('home')}
          onRetry={loadCatalog}
        />
      );
    }

    if (screen === 'planDetails') {
      return (
        <PlanDetails
          theme={theme}
          catalog={catalog}
          loading={catalogLoading}
          error={catalogError}
          onCheckout={product => {
            analytics.track({ name: 'checkout_started', payload: { productId: product.id } });
            setSelectedProduct(product);
            setScreen('checkout');
          }}
          onBack={() => setScreen('home')}
          onRetry={loadCatalog}
          onStartPayPal={async product => {
            const res = await backendClient.createPayPalSubscription('demo-user', product.id);
            setSelectedProduct(product);
            setApprovalUrl(res.approvalUrl);
            setProviderSubscriptionId(res.providerSubscriptionId);
            setScreen('planDetails');
          }}
        />
      );
    }

    if (screen === 'checkout' && selectedProduct) {
      return (
        <CheckoutStart
          theme={theme}
          product={selectedProduct}
          status={checkoutStatus}
          message={message}
          onConfirm={() => startCheckout(selectedProduct)}
          onCancel={() => setScreen('shop')}
        />
      );
    }

    if (screen === 'planDetails' && approvalUrl) {
      return (
        <CheckoutStart
          theme={theme}
          product={{
            id: selectedProduct?.id || 'plan_pro',
            name: 'PayPal Approval',
            description: approvalUrl,
            price: '',
            type: 'plan',
          }}
          status={checkoutStatus}
          message={'Approve the subscription in the browser then tap confirm.'}
          onConfirm={async () => {
            if (providerSubscriptionId) {
              await backendClient.confirmPayPalSubscription(providerSubscriptionId, 'demo-user');
              await refreshEntitlements();
              setScreen('success');
            }
          }}
          onCancel={() => setScreen('home')}
        />
      );
    }

    if (screen === 'success') {
      return (
        <PurchaseSuccess
          theme={theme}
          entitlements={entitlements}
          loading={entitlementsLoading}
          message={message}
          onContinue={() => setScreen('home')}
        />
      );
    }

    return null;
  };

  return (
    <View
      style={[
        styles.screen,
        {
          paddingTop: safeAreaInsets.top,
          paddingBottom: safeAreaInsets.bottom,
          backgroundColor: theme.background,
        },
      ]}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { paddingHorizontal: 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={[styles.badge, { backgroundColor: theme.accentSoft }]}>
            <Text style={[styles.badgeText, { color: theme.accent }]}>
              Unified API Gateway
            </Text>
          </View>
          <Text style={[styles.title, { color: theme.text }]}>
            Money Generator OS for Gig Workers
          </Text>
          <Text style={[styles.subtitle, { color: theme.subtle }]}>
            Orchestrate earnings, benefits, and workflows through a single
            Master Key. Aggregate jobs, automate financial health, and plug into
            verified third-party tools with enterprise-grade compliance.
          </Text>

          <View style={styles.ctaRow}>
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: theme.accent }]}
              activeOpacity={0.9}
            >
              <Text style={styles.primaryButtonText}>Launch Control Center</Text>
            </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.secondaryButton,
              { borderColor: theme.border, backgroundColor: theme.card },
            ]}
            activeOpacity={0.9}
            onPress={() => backendClient.healthCheck()}
          >
            <Text style={[styles.secondaryButtonText, { color: theme.text }]}>
              View API Catalog
            </Text>
          </TouchableOpacity>
        </View>

          <View style={styles.statsRow}>
            {stats.map(stat => (
              <View
                key={stat.label}
                style={[
                  styles.statItem,
                  {
                    borderColor: theme.border,
                  },
                ]}
              >
                <Text style={[styles.statValue, { color: theme.text }]}>
                  {stat.value}
                </Text>
                <Text style={[styles.statLabel, { color: theme.subtle }]}>
                  {stat.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <Section
          theme={theme}
          title="Use-case specific workflows"
          description="Ready-made control planes for common gig modes with smart automations baked in."
        >
          <View style={styles.cardGrid}>
            {workflows.map(item => (
              <Card key={item.title} theme={theme}>
                <View style={styles.cardHeader}>
                  <Text style={[styles.cardTitle, { color: theme.text }]}>
                    {item.title}
                  </Text>
                  <Pill label={item.mode} theme={theme} />
                </View>
                <Text style={[styles.cardDescription, { color: theme.subtle }]}>
                  {item.description}
                </Text>
                <View style={styles.tagRow}>
                  {item.highlights.map(tag => (
                    <Tag key={tag} label={tag} theme={theme} />
                  ))}
                </View>
              </Card>
            ))}
          </View>
        </Section>

        <Section
          theme={theme}
          title="Integration Hub"
          description="Pre-verified partners delivered through the Master Key so users never manage individual credentials."
        >
          <View style={styles.cardGrid}>
            {integrations.map(item => (
              <Card key={item.title} theme={theme}>
                <View style={styles.cardHeader}>
                  <Text style={[styles.cardTitle, { color: theme.text }]}>
                    {item.title}
                  </Text>
                  <Pill label={item.category} theme={theme} />
                </View>
                <Text style={[styles.cardDescription, { color: theme.subtle }]}>
                  {item.description}
                </Text>
                <View style={styles.tagRow}>
                  {item.tags.map(tag => (
                    <Tag key={tag} label={tag} theme={theme} />
                  ))}
                </View>
              </Card>
            ))}
          </View>
        </Section>

        <Section
          theme={theme}
          title="Subscriptions & Plans"
          description="Access the embedded shop to upgrade plans, add-ons, or one-time boosts."
        >
          <View style={styles.cardGrid}>
            <Card theme={theme}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Plan upgrades</Text>
              <Text style={[styles.cardDescription, { color: theme.subtle }]}>
                Enter the shop to choose a plan, manage billing, or add add-ons.
              </Text>
              <View style={styles.ctaRow}>
                <TouchableOpacity
                  style={[styles.primaryButton, { backgroundColor: theme.accent }]}
                  activeOpacity={0.9}
                  onPress={() => setScreen('shop')}
                >
                  <Text style={styles.primaryButtonText}>Open Shop</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.secondaryButton, { borderColor: theme.border }]}
                  activeOpacity={0.9}
                  onPress={() => setScreen('planDetails')}
                >
                  <Text style={[styles.secondaryButtonText, { color: theme.text }]}>
                    Settings → Billing
                  </Text>
                </TouchableOpacity>
              </View>
              <FeatureGate
                theme={theme}
                entitlements={entitlements}
                onUpgrade={() => {
                  analytics.track({ name: 'checkout_started' });
                  setScreen('checkout');
                }}
              />
            </Card>
          </View>
        </Section>

        <Section
          theme={theme}
          title="Integration endpoints"
          description="Backend-only secrets for billing, Plaid link, and entitlements. RN calls go through the integration service."
        >
          <View style={styles.cardGrid}>
            {integrationEndpoints.map(item => (
              <Card key={item.title} theme={theme}>
                <View style={styles.cardHeader}>
                  <Text style={[styles.cardTitle, { color: theme.text }]}>
                    {item.title}
                  </Text>
                  <Pill label={item.method} theme={theme} />
                </View>
                <Text style={[styles.cardDescription, { color: theme.subtle }]}>
                  {item.description}
                </Text>
                <View style={styles.tagRow}>
                  {item.tags.map(tag => (
                    <Tag key={tag} label={tag} theme={theme} />
                  ))}
                </View>
              </Card>
            ))}
          </View>
        </Section>

        <Section
          theme={theme}
          title="Master Key architecture"
          description="One token, many providers. Our proxy layer routes to the optimal downstream service with markup, KYC, and observability baked in."
        >
          <Card theme={theme}>
            <View style={styles.architectureRow}>
              {architecture.map(item => (
                <View key={item.title} style={styles.architectureItem}>
                  <View
                    style={[
                      styles.stepBadge,
                      { backgroundColor: theme.accentSoft },
                    ]}
                  >
                    <Text
                      style={[styles.stepBadgeText, { color: theme.accent }]}
                    >
                      {item.step}
                    </Text>
                  </View>
                  <Text style={[styles.archTitle, { color: theme.text }]}>
                    {item.title}
                  </Text>
                  <Text style={[styles.archCopy, { color: theme.subtle }]}>
                    {item.description}
                  </Text>
                </View>
              ))}
            </View>
            <View
              style={[
                styles.codeBlock,
                { backgroundColor: theme.codeBackground },
              ]}
            >
              <Text style={[styles.codeText, { color: theme.codeText }]}>
                {`POST /api/v1/payout
Authorization: Bearer MASTER_KEY
{
  "amount": 150,
  "destination": "debit_card"
}`}
              </Text>
              <Text
                style={[styles.codeHint, { color: theme.subtle, marginTop: 8 }]}
              >
                Proxy adds markup, checks tier, and routes to optimal provider
                (Stripe/Unit) using enterprise creds.
              </Text>
            </View>
          </Card>
        </Section>

        <Section
          theme={theme}
          title="Monetization & pricing"
          description="Stacked revenue levers with transparent pricing that scales with throughput."
        >
          <View style={styles.cardGrid}>
            {monetization.map(item => (
              <Card key={item.title} theme={theme}>
                <View style={styles.cardHeader}>
                  <Text style={[styles.cardTitle, { color: theme.text }]}>
                    {item.title}
                  </Text>
                  <Pill label={item.model} theme={theme} />
                </View>
                <Text style={[styles.cardDescription, { color: theme.subtle }]}>
                  {item.description}
                </Text>
                <View style={styles.tagRow}>
                  {item.notes.map(note => (
                    <Tag key={note} label={note} theme={theme} />
                  ))}
                </View>
              </Card>
            ))}
          </View>
        </Section>

        <Section
          theme={theme}
          title="Risk & compliance guardrails"
          description="Pre-baked controls to keep enterprise keys safe and traffic auditable."
        >
          <Card theme={theme}>
            {risks.map(item => (
              <View
                key={item.title}
                style={[
                  styles.listRow,
                  { borderColor: theme.border, backgroundColor: theme.card },
                ]}
              >
                <View
                  style={[
                    styles.bullet,
                    { backgroundColor: theme.accentSoft },
                  ]}
                />
                <View style={styles.listText}>
                  <Text style={[styles.listTitle, { color: theme.text }]}>
                    {item.title}
                  </Text>
                  <Text style={[styles.listCopy, { color: theme.subtle }]}>
                    {item.description}
                  </Text>
                </View>
              </View>
            ))}
          </Card>
        </Section>

        <Section
          theme={theme}
          title="Deployment readiness"
          description="Prioritized next steps to ship the MVP and expand coverage fast."
        >
          <Card theme={theme}>
            <View style={styles.tagRow}>
              {deployment.map(item => (
                <View
                  key={item}
                  style={[
                    styles.roadmapPill,
                    { backgroundColor: theme.accentSoft },
                  ]}
                >
                  <Text style={[styles.roadmapText, { color: theme.accent }]}>
                    {item}
                  </Text>
                </View>
              ))}
            </View>
          </Card>
        </Section>
      </ScrollView>
      {renderBody()}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingBottom: 36,
    gap: 24,
  },
  heroCard: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#0F172A',
    gap: 14,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  ctaRow: {
    flexDirection: 'row',
    gap: 10,
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
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  statItem: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 110,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  sectionDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    flex: 1,
    minWidth: 260,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    flex: 1,
    paddingRight: 8,
  },
  cardDescription: {
    fontSize: 13,
    lineHeight: 19,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  architectureRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  architectureItem: {
    flex: 1,
    minWidth: 220,
    gap: 6,
  },
  stepBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  stepBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  archTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  archCopy: {
    fontSize: 13,
    lineHeight: 19,
  },
  codeBlock: {
    marginTop: 10,
    padding: 12,
    borderRadius: 12,
  },
  codeText: {
    fontFamily: 'Courier',
    fontSize: 13,
    lineHeight: 18,
  },
  codeHint: {
    fontSize: 12,
    lineHeight: 18,
  },
  listRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  bullet: {
    width: 10,
    height: 10,
    borderRadius: 999,
    marginTop: 6,
  },
  listText: {
    flex: 1,
  },
  listTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  listCopy: {
    fontSize: 13,
    lineHeight: 18,
  },
  roadmapPill: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  roadmapText: {
    fontSize: 13,
    fontWeight: '800',
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
  overlayContent: {
    gap: 12,
    paddingBottom: 40,
  },
  alert: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    gap: 8,
  },
});

const lightTheme = {
  background: '#F4F5F7',
  card: '#FFFFFF',
  text: '#0B1222',
  subtle: '#4B5563',
  border: '#E5E7EB',
  accent: '#7C3AED',
  accentSoft: '#EDE9FE',
  codeBackground: '#0B1222',
  codeText: '#E5E7EB',
};

const darkTheme = {
  background: '#0B1222',
  card: '#11182B',
  text: '#F8FAFC',
  subtle: '#AAB3C5',
  border: '#1F2937',
  accent: '#A78BFA',
  accentSoft: '#1E1B4B',
  codeBackground: '#11182B',
  codeText: '#E5E7EB',
};

type Theme = typeof lightTheme;

type Product = {
  id: string;
  type: string;
  name: string;
  price: string;
  description: string;
};

type Item = {
  title: string;
  description: string;
};

const stats = [
  { label: 'Market trajectory', value: '$2.1T by 2034' },
  { label: 'Coverage', value: '20+ partner APIs' },
  { label: 'Payout latency', value: '< 60s to card' },
  { label: 'Security', value: 'SOC2 + KYC-first' },
];

const workflows: Array<
  Item & { mode: string; highlights: string[] }
> = [
  {
    title: 'Delivery mode',
    mode: 'Mileage + batching',
    description:
      'ShiftMate logic optimizes routes, logs mileage, and surfaces surge zones across DoorDash, Uber, and Instacart.',
    highlights: ['Live surge overlays', 'Auto mileage logs', 'Smart batching'],
  },
  {
    title: 'Freelance mode',
    mode: 'Time + proposals',
    description:
      'Templates for writing, design, and dev gigs with proposal history, escrow reminders, and auto-invoicing hooks.',
    highlights: ['Proposal vault', 'Escrow triggers', 'Client CRM'],
  },
  {
    title: 'Local services mode',
    mode: 'Trusted labor',
    description:
      'TaskRabbit-style workflows with background checks, insurance flags, and standardized checklists.',
    highlights: ['Checklist templates', 'Background checks', 'Insurance proof'],
  },
];

const integrations: Array<
  Item & { category: string; tags: string[] }
> = [
  {
    title: 'EarnIn',
    category: 'Liquidity',
    description:
      'Instant cash-out up to $150/day routed via our treasury partner; respects payout limits per tier.',
    tags: ['Cash advances', 'Payout routing', 'Treasury controls'],
  },
  {
    title: 'Catch',
    category: 'Benefits',
    description:
      'Automated tax withholding, portable health and retirement contributions linked to every payout.',
    tags: ['Tax vaults', 'Health + retirement', 'Auto percentages'],
  },
  {
    title: 'Expensify',
    category: 'Expenses',
    description:
      'Receipt OCR, category rules, and reimbursement flows fed into analytics for true profit tracking.',
    tags: ['OCR', 'Policy rules', 'Profitability'],
  },
  {
    title: 'ShiftMate',
    category: 'Optimization',
    description:
      'Shift tracking, mileage logging, and earnings analysis to maximize active time across platforms.',
    tags: ['Shift IQ', 'Mileage', 'Multi-app'],
  },
  {
    title: 'Task boards',
    category: 'Demand',
    description:
      'Unified feed for TaskRabbit, Fiverr, and Upwork with skills filters and response timers.',
    tags: ['Unified feed', 'Skill filters', 'Fast reply'],
  },
];

const architecture: Array<Item & { step: string }> = [
  {
    step: '01',
    title: 'Authenticate once',
    description:
      'Users receive a Master Key after KYC; traffic is signed and replay-protected with rotating keys.',
  },
  {
    step: '02',
    title: 'Route intelligently',
    description:
      'Router picks best provider (Stripe/Unit/EarnIn) per tier, geography, and SLA, applying markup automatically.',
  },
  {
    step: '03',
    title: 'Observe everything',
    description:
      'Full audit logs, latency SLOs, and incident webhooks so ops teams can intervene quickly.',
  },
  {
    step: '04',
    title: 'Fail over safely',
    description:
      'Provider health checks, circuit breakers, and queued retries keep payouts flowing even during outages.',
  },
];

const monetization: Array<
  Item & { model: string; notes: string[] }
> = [
  {
    title: 'Tiered subscriptions',
    model: 'Freemium → Pro',
    description:
      'Free tier for tracking; Pro ($10–$20/mo) unlocks advanced analytics, instant cash-out, and automated tax rules.',
    notes: ['Free onboarding', 'Usage gates', 'Seat-based add-ons'],
  },
  {
    title: 'Marketplace revenue share',
    model: '15–30% markup',
    description:
      'White-label third-party tools sold inside the hub. Users pay once; we handle billing and provider splits.',
    notes: ['Bundled billing', 'Provider split', 'Churn-safe'],
  },
  {
    title: 'Utility markup',
    model: 'Cost-plus',
    description:
      'Apply a 15–30% premium on wholesale API costs (e.g., background checks, payouts) for turnkey access.',
    notes: ['Transparent fees', 'Tier-aware', 'Rate limits'],
  },
  {
    title: 'Float interest (regulated)',
    model: 'Treasury',
    description:
      'For eligible regions, hold funds in staging wallets and capture float while observing compliance boundaries.',
    notes: ['BaaS only', 'Segregated funds', 'Audit-ready'],
  },
];

const integrationEndpoints = [
  {
    title: 'Create subscription',
    method: 'POST /integrations/subscribe',
    description: 'Creates a backend-owned subscription and entitlement for the active user.',
    tags: ['Backend only', 'PayPal vault', 'Entitlements'],
  },
  {
    title: 'Plaid link token',
    method: 'POST /integrations/plaid/link-token',
    description: 'Issues a short-lived link token without exposing client secrets on-device.',
    tags: ['No tokens on device', 'View-only', 'Link'],
  },
  {
    title: 'Plaid token exchange',
    method: 'POST /integrations/plaid/exchange',
    description: 'Exchanges public_token for a server-held access_token; stores normalized item/account.',
    tags: ['Server-held tokens', 'Read-only', 'Normalized'],
  },
  {
    title: 'Webhooks',
    method: 'POST /webhooks/*',
    description: 'Idempotent, signed webhook handlers for PayPal and Plaid with observability hooks.',
    tags: ['Signed', 'Idempotent', 'Metrics'],
  },
];

const shopCatalogEmpty: Product[] = [];

const risks: Item[] = [
  {
    title: 'Enterprise-only credentials',
    description:
      'Avoid the reseller trap; operate under OEM or platform agreements (Unit, Treasury Prime, Stripe, EarnIn).',
  },
  {
    title: 'KYC before issuance',
    description:
      'IDV + AML screening prior to issuing Master Keys, with ongoing watchlist monitoring.',
  },
  {
    title: 'Data privacy posture',
    description:
      'GDPR/CCPA alignment with encryption in transit and at rest, scoped tokens, and minimal data retention.',
  },
  {
    title: 'Abuse and fraud detection',
    description:
      'Velocity rules, device fingerprinting, and anomaly scoring to shut down risky routes in real time.',
  },
];

const deployment = [
  'Finalize BaaS + treasury partner (Unit/Treasury Prime)',
  'Ship payouts + job feed MVP with three providers',
  'Stand up audit logging + observability dashboards',
  'Open plugin SDK for third-party tool vendors',
];

type SectionProps = {
  title: string;
  description: string;
  children: React.ReactNode;
  theme: Theme;
};

function Section({ title, description, children, theme }: SectionProps) {
  return (
    <View style={styles.section}>
      <View>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          {title}
        </Text>
        <Text style={[styles.sectionDescription, { color: theme.subtle }]}>
          {description}
        </Text>
      </View>
      {children}
    </View>
  );
}

type CardProps = {
  children: React.ReactNode;
  theme: Theme;
};

function Card({ children, theme }: CardProps) {
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
        },
      ]}
    >
      {children}
    </View>
  );
}

type PillProps = {
  label: string;
  theme: Theme;
};

function Pill({ label, theme }: PillProps) {
  return (
    <View
      style={[
        styles.pill,
        { backgroundColor: theme.accentSoft, borderWidth: 0 },
      ]}
    >
      <Text style={[styles.pillText, { color: theme.accent }]}>{label}</Text>
    </View>
  );
}

type TagProps = {
  label: string;
  theme: Theme;
};

function Tag({ label, theme }: TagProps) {
  return (
    <View
      style={[
        styles.tag,
        { borderColor: theme.border, backgroundColor: theme.card },
      ]}
    >
      <Text style={[styles.tagText, { color: theme.text }]}>{label}</Text>
    </View>
  );
}

type ShopProps = {
  theme: Theme;
  catalog: Product[];
  loading: boolean;
  error: string | null;
  onSelect: (product: Product) => void;
  onBack: () => void;
  onRetry: () => void;
};

function ShopScreen({ theme, catalog, loading, error, onSelect, onBack, onRetry }: ShopProps) {
  return (
    <View style={[styles.overlay, { backgroundColor: theme.background }]}>
      <View style={styles.overlayHeader}>
        <Text style={[styles.title, { color: theme.text }]}>Embedded Shop</Text>
        <TouchableOpacity onPress={onBack}>
          <Text style={[styles.secondaryButtonText, { color: theme.text }]}>Close</Text>
        </TouchableOpacity>
      </View>
      {loading && <ActivityIndicator color={theme.accent} />}
      {error && (
        <View style={styles.alert}>
          <Text style={[styles.sectionDescription, { color: theme.text }]}>{error}</Text>
          <Pressable onPress={onRetry}>
            <Text style={[styles.secondaryButtonText, { color: theme.accent }]}>Retry</Text>
          </Pressable>
        </View>
      )}
      <ScrollView contentContainerStyle={styles.overlayContent}>
        {(catalog || shopCatalogEmpty).map(product => (
          <Pressable
            key={product.id}
            onPress={() => onSelect(product)}
            style={[
              styles.card,
              { backgroundColor: theme.card, borderColor: theme.border, padding: 16 },
            ]}
          >
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>{product.name}</Text>
              <Pill label={product.price} theme={theme} />
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

type PlanDetailsProps = {
  theme: Theme;
  catalog: Product[];
  loading: boolean;
  error: string | null;
  onCheckout: (product: Product) => void;
  onBack: () => void;
  onRetry: () => void;
  onStartPayPal: (plan: Product) => void;
};

function PlanDetails({
  theme,
  catalog,
  loading,
  error,
  onCheckout,
  onBack,
  onRetry,
  onStartPayPal,
}: PlanDetailsProps) {
  const plans = catalog.filter(item => item.type === 'plan');
  return (
    <View style={[styles.overlay, { backgroundColor: theme.background }]}>
      <View style={styles.overlayHeader}>
        <Text style={[styles.title, { color: theme.text }]}>Subscription Plans</Text>
        <TouchableOpacity onPress={onBack}>
          <Text style={[styles.secondaryButtonText, { color: theme.text }]}>Back</Text>
        </TouchableOpacity>
      </View>
      {loading && <ActivityIndicator color={theme.accent} />}
      {error && (
        <View style={styles.alert}>
          <Text style={[styles.sectionDescription, { color: theme.text }]}>{error}</Text>
          <Pressable onPress={onRetry}>
            <Text style={[styles.secondaryButtonText, { color: theme.accent }]}>Retry</Text>
          </Pressable>
        </View>
      )}
      <ScrollView contentContainerStyle={styles.overlayContent}>
        {plans.map(plan => (
          <View
            key={plan.id}
            style={[
              styles.card,
              { backgroundColor: theme.card, borderColor: theme.border, padding: 16 },
            ]}
          >
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>{plan.name}</Text>
              <Pill label={plan.price} theme={theme} />
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

function CheckoutStart({ theme, product, status, message, onConfirm, onCancel }: CheckoutProps) {
  return (
    <View style={[styles.overlay, { backgroundColor: theme.background }]}>
      <View style={styles.overlayHeader}>
        <Text style={[styles.title, { color: theme.text }]}>Checkout</Text>
        <TouchableOpacity onPress={onCancel}>
          <Text style={[styles.secondaryButtonText, { color: theme.text }]}>Cancel</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.card}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>{product.name}</Text>
        <Text style={[styles.cardDescription, { color: theme.subtle }]}>{product.description}</Text>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>{product.price}</Text>
        {message && <Text style={[styles.sectionDescription, { color: theme.subtle }]}>{message}</Text>}
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
        {status === 'error' && (
          <Pressable onPress={onConfirm}>
            <Text style={[styles.secondaryButtonText, { color: theme.accent }]}>Retry</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

type PurchaseSuccessProps = {
  theme: Theme;
  entitlements: any[];
  loading: boolean;
  message: string | null;
  onContinue: () => void;
};

function PurchaseSuccess({ theme, entitlements, loading, message, onContinue }: PurchaseSuccessProps) {
  return (
    <View style={[styles.overlay, { backgroundColor: theme.background }]}>
      <View style={styles.overlayHeader}>
        <Text style={[styles.title, { color: theme.text }]}>Purchase Success</Text>
        <TouchableOpacity onPress={onContinue}>
          <Text style={[styles.secondaryButtonText, { color: theme.text }]}>Close</Text>
        </TouchableOpacity>
      </View>
      {message && <Text style={[styles.sectionDescription, { color: theme.subtle }]}>{message}</Text>}
      {loading ? (
        <ActivityIndicator color={theme.accent} />
      ) : (
        <View style={{ gap: 10 }}>
          {entitlements.map(item => (
            <View
              key={item.id}
              style={[
                styles.listRow,
                { borderColor: theme.border, backgroundColor: theme.card, marginBottom: 0 },
              ]}
            >
              <View style={[styles.bullet, { backgroundColor: theme.accentSoft }]} />
              <View style={styles.listText}>
                <Text style={[styles.listTitle, { color: theme.text }]}>{item.productId}</Text>
                <Text style={[styles.listCopy, { color: theme.subtle }]}>
                  Active from {item.effectiveAt}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

type FeatureGateProps = {
  theme: Theme;
  entitlements: any[];
  onUpgrade: () => void;
};

function FeatureGate({ theme, entitlements, onUpgrade }: FeatureGateProps) {
  const hasPro = entitlements.some(e => e.productId === 'plan_pro');
  if (hasPro) return null;
  return (
    <View style={styles.alert}>
      <Text style={[styles.sectionDescription, { color: theme.subtle }]}>
        Unlock premium analytics with Pro.
      </Text>
      <TouchableOpacity
        style={[styles.secondaryButton, { borderColor: theme.border, backgroundColor: theme.card }]}
        onPress={onUpgrade}
      >
        <Text style={[styles.secondaryButtonText, { color: theme.text }]}>Upgrade</Text>
      </TouchableOpacity>
    </View>
  );
}

export default App;
