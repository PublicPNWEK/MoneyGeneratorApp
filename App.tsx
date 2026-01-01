import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { backendClient } from './app/services/backend';
import { useEntitlements } from './app/hooks/useEntitlements';
import { analytics } from './app/services/analytics';

type Theme = {
  background: string;
  card: string;
  text: string;
  subtle: string;
  border: string;
  accent: string;
  accentSoft: string;
};

type Product = {
  id: string;
  type: string;
  name: string;
  price: string;
  description: string;
  billingCycle?: string;
};

type Transaction = {
  id: string;
  name: string;
  amount: string;
  category: string;
  date: string;
};

type Account = {
  id: string;
  institution: string;
  type: string;
  lastFour: string;
  status: 'connected' | 'pending';
};

const lightTheme: Theme = {
  background: '#F5F7FB',
  card: '#FFFFFF',
  text: '#0B1222',
  subtle: '#4B5563',
  border: '#E5E7EB',
  accent: '#7C3AED',
  accentSoft: '#EDE9FE',
};

const darkTheme: Theme = {
  background: '#0B1222',
  card: '#11182B',
  text: '#F8FAFC',
  subtle: '#AAB3C5',
  border: '#1F2937',
  accent: '#A78BFA',
  accentSoft: '#1E1B4B',
};

const defaultTransactions: Transaction[] = [
  { id: 't1', name: 'DoorDash payout', amount: '+$186.20', category: 'Income', date: 'Today' },
  { id: 't2', name: 'Fuel', amount: '-$34.80', category: 'Expense', date: 'Yesterday' },
  { id: 't3', name: 'Earnings transfer', amount: '+$320.00', category: 'Income', date: 'Mon' },
  { id: 't4', name: 'Toll road', amount: '-$8.50', category: 'Expense', date: 'Sun' },
];

const defaultAccounts: Account[] = [
  { id: 'acc1', institution: 'Plaid Sandbox Bank', type: 'Checking', lastFour: '1881', status: 'connected' },
];

const navigationOrder: Array<'overview' | 'subscriptions' | 'settings' | 'finance'> = [
  'overview',
  'subscriptions',
  'settings',
  'finance',
];

function App() {
  const colorScheme = useColorScheme();
  const theme = useMemo(() => (colorScheme === 'dark' ? darkTheme : lightTheme), [colorScheme]);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
        <Root theme={theme} />
      </SafeAreaView>
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
  const [financeRollup, setFinanceRollup] = React.useState<any | null>(null);
  const [financeLoading, setFinanceLoading] = React.useState(false);
  const [financeError, setFinanceError] = React.useState<string | null>(null);

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

  useEffect(() => {
    loadCatalog();
    analytics.track({ name: 'app_viewed' });
  }, [loadCatalog]);

  const refreshFinanceRollup = React.useCallback(async () => {
    setFinanceLoading(true);
    setFinanceError(null);
    try {
      analytics.track({
        eventType: 'finance_dashboard_viewed',
        payload: { surface: 'mobile_app' },
      });
      await backendClient.runDailyRollup();
      const data = await backendClient.fetchDailyRollup('demo-user');
      setFinanceRollup(data.rollup);
    } catch (err: any) {
      setFinanceError(err.message || 'Unable to load finance metrics');
    } finally {
      setFinanceLoading(false);
    }
  }, []);

  const startCheckout = async (product: Product) => {
    setSelectedPlan(product);
    setCheckoutStatus('loading');
    setNotification(null);
    try {
      await backendClient.purchase(product.id, 'demo-user');
      await refreshEntitlements();
      setCheckoutStatus('success');
      setNotification(`${product.name} activated.`);
      analytics.track({ name: 'purchase_completed', payload: { productId: product.id } });
    } catch (err: any) {
      setCheckoutStatus('error');
      setNotification(err.message || 'Checkout failed. Please retry.');
    }
  };

  const startPayPalFlow = async (plan: Product) => {
    setNotification('Launching PayPal approval...');
    const res = await backendClient.createPayPalSubscription('demo-user', plan.id);
    setPayPalState({ approvalUrl: res.approvalUrl, providerSubscriptionId: res.providerSubscriptionId, status: 'awaiting' });
    setSelectedPlan(plan);
  };

  const confirmPayPal = async () => {
    if (!payPalState.providerSubscriptionId) return;
    setCheckoutStatus('loading');
    await backendClient.confirmPayPalSubscription(payPalState.providerSubscriptionId, 'demo-user');
    await refreshEntitlements();
    setCheckoutStatus('success');
    setNotification('PayPal subscription confirmed.');
    setPayPalState(prev => ({ ...prev, status: 'active' }));
  };

  const cancelPayPal = async () => {
    if (!payPalState.providerSubscriptionId) return;
    await backendClient.cancelPayPalSubscription(payPalState.providerSubscriptionId);
    setNotification('Subscription cancelled.');
    setPayPalState({ approvalUrl: null, providerSubscriptionId: null, status: 'idle' });
    await refreshEntitlements();
  };

  const managePaymentMethod = async () => {
    setCheckoutStatus('loading');
    try {
      await backendClient.updatePaymentMethod('demo-user', 'pm_mock_visa');
      setNotification('Payment method refreshed for future renewals.');
      setCheckoutStatus('success');
    } catch (err: any) {
      setCheckoutStatus('error');
      setNotification(err.message || 'Unable to update payment method.');
    }
  };

  const createLinkToken = async () => {
    const res = await backendClient.createPlaidLinkToken('demo-user');
    setPlaidState(prev => ({ ...prev, linkToken: res.linkToken || 'sandbox-token', connected: false }));
    setNotification('Link token issued. Complete Plaid flow to connect.');
  };

  const exchangePlaidToken = async () => {
    await backendClient.exchangePlaidPublicToken('public-sandbox-token', 'demo-user');
    setPlaidState(prev => ({ ...prev, connected: true, lastSync: 'Just now', accounts: defaultAccounts }));
    setNotification('Bank connection established (read-only).');
  };

  const refreshTransactions = () => {
    setTransactions(prev => [...prev]);
    setNotification('Transactions refreshed from Plaid (view-only).');
  };

  const annualPlan = catalog.find(item => item.type === 'annual');
  const addonProducts = catalog.filter(item => item.type === 'addon');
  const planProducts = catalog.filter(item => item.type === 'plan' || item.type === 'annual');

  const activePlanLabel = entitlements[0]?.productId || 'Free';

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header theme={theme} activeTab={activeTab} onTabChange={setActiveTab} />
      {notification ? <Banner theme={theme} message={notification} /> : null}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {activeTab === 'overview' && (
          <OverviewScreen
            theme={theme}
            activePlan={activePlanLabel}
            onNavigate={setActiveTab}
            entitlementsLoading={entitlementsLoading}
            billingStatus={payPalState.status}
          />
        )}

        {activeTab === 'subscriptions' && (
          <SubscriptionScreen
            theme={theme}
            catalog={planProducts}
            addons={addonProducts}
            annualPlan={annualPlan}
            loading={catalogLoading || entitlementsLoading}
            error={catalogError || entitlementsError || null}
            checkoutStatus={checkoutStatus}
            selectedPlan={selectedPlan}
            payPalState={payPalState}
            onRefreshCatalog={loadCatalog}
            onStartCheckout={startCheckout}
            onStartPayPal={startPayPalFlow}
            onConfirmPayPal={confirmPayPal}
            onCancelSubscription={cancelPayPal}
            onManagePaymentMethod={managePaymentMethod}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsScreen
            theme={theme}
            plaidState={plaidState}
            onCreateLinkToken={createLinkToken}
            onExchangeToken={exchangePlaidToken}
            onGoToBilling={() => setActiveTab('subscriptions')}
            payPalStatus={payPalState.status}
          />
        )}

        {activeTab === 'finance' && (
          <FinanceScreen
            theme={theme}
            plaidState={plaidState}
            transactions={transactions}
            onRefreshFeed={refreshTransactions}
          />
        )}
      </ScrollView>
    </View>
  );
}

function Header({
  theme,
  activeTab,
  onTabChange,
}: {
  theme: Theme;
  activeTab: 'overview' | 'subscriptions' | 'settings' | 'finance';
  onTabChange: (tab: 'overview' | 'subscriptions' | 'settings' | 'finance') => void;
}) {
  return (
    <View style={styles.header}>
      <View>
        <Text style={[styles.appTitle, { color: theme.text }]}>Money Generator Control</Text>
        <Text style={[styles.appSubtitle, { color: theme.subtle }]}>
          Integration map for billing, banking, and CRM webhooks.
        </Text>
      </View>
      <View style={styles.tabRow}>
        {navigationOrder.map(tab => (
          <TouchableOpacity
            key={tab}
            onPress={() => onTabChange(tab)}
            style={[
              styles.tab,
              {
                borderColor: activeTab === tab ? theme.accent : theme.border,
                backgroundColor: activeTab === tab ? theme.accentSoft : theme.card,
              },
            ]}
          >
            <Text
              style={{
                color: activeTab === tab ? theme.accent : theme.text,
                fontWeight: '700',
              }}
            >
              {tab === 'overview' ? 'Overview' : tab === 'subscriptions' ? 'Subscriptions' : tab === 'settings' ? 'Settings' : 'Finance'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function OverviewScreen({
  theme,
  activePlan,
  onNavigate,
  entitlementsLoading,
  billingStatus,
}: {
  theme: Theme;
  activePlan: string;
  onNavigate: (tab: 'overview' | 'subscriptions' | 'settings' | 'finance') => void;
  entitlementsLoading: boolean;
  billingStatus: string;
}) {
  return (
    <View style={styles.grid}>
      <Card theme={theme}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>Getting started</Text>
        <Text style={[styles.cardCopy, { color: theme.subtle }]}>Navigate directly to the most common integration entry points.</Text>
        <View style={styles.quickRow}>
          <PrimaryButton label="Manage billing" theme={theme} onPress={() => onNavigate('subscriptions')} />
          <SecondaryButton label="Settings" theme={theme} onPress={() => onNavigate('settings')} />
        </View>
        <Text style={[styles.meta, { color: theme.subtle }]}>Current plan: {entitlementsLoading ? 'Refreshing...' : activePlan}</Text>
        <Text style={[styles.meta, { color: theme.subtle }]}>Billing state: {billingStatus === 'active' ? 'Active' : 'Pending confirmation'}</Text>
      </Card>

      <Card theme={theme}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>Read-only finance tools</Text>
        <Text style={[styles.cardCopy, { color: theme.subtle }]}>
          Connect Plaid from Settings, then review balances and transactions in Finance. No editing or payments exist here.
        </Text>
        <PrimaryButton label="Open Finance" theme={theme} onPress={() => onNavigate('finance')} />
      </Card>

      <Card theme={theme}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>Webhooks and CRM integrations</Text>
        <Text style={[styles.cardCopy, { color: theme.subtle }]}>
          Configure webhook destinations from Settings → Integrations. Leads and payouts stay in sync across CRMs.
        </Text>
        <SecondaryButton label="Go to Integrations" theme={theme} onPress={() => onNavigate('settings')} />
      </Card>
    </View>
  );
}

function SubscriptionScreen({
  theme,
  catalog,
  addons,
  annualPlan,
  loading,
  error,
  checkoutStatus,
  selectedPlan,
  payPalState,
  onRefreshCatalog,
  onStartCheckout,
  onStartPayPal,
  onConfirmPayPal,
  onCancelSubscription,
  onManagePaymentMethod,
}: {
  theme: Theme;
  catalog: Product[];
  addons: Product[];
  annualPlan?: Product | undefined;
  loading: boolean;
  error: string | null;
  checkoutStatus: 'idle' | 'loading' | 'error' | 'success';
  selectedPlan: Product | null;
  payPalState: { approvalUrl: string | null; providerSubscriptionId: string | null; status: 'idle' | 'awaiting' | 'active' };
  onRefreshCatalog: () => void;
  onStartCheckout: (product: Product) => void;
  onStartPayPal: (product: Product) => void;
  onConfirmPayPal: () => void;
  onCancelSubscription: () => void;
  onManagePaymentMethod: () => void;
}) {
  return (
    <View style={styles.grid}>
      <Card theme={theme}>
        <View style={styles.cardHeaderRow}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Billing center</Text>
          <TouchableOpacity onPress={onRefreshCatalog}>
            <Text style={[styles.link, { color: theme.accent }]}>Refresh catalog</Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.cardCopy, { color: theme.subtle }]}>
          Start, cancel, or confirm subscriptions. PayPal approvals stay in this lane, and payment method updates are routed through the backend.
        </Text>
        {loading && <ActivityIndicator color={theme.accent} />}
        {error && <Text style={[styles.errorText, { color: '#DC2626' }]}>{error}</Text>}
        <View style={styles.planList}>
          {catalog.map(plan => (
            <View key={plan.id} style={[styles.planRow, { borderColor: theme.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.planTitle, { color: theme.text }]}>{plan.name}</Text>
                <Text style={[styles.meta, { color: theme.subtle }]}>{plan.description}</Text>
              </View>
              <Pill theme={theme} label={plan.price} />
              <PrimaryButton label="Start" theme={theme} onPress={() => onStartCheckout(plan)} />
              <SecondaryButton label="PayPal" theme={theme} onPress={() => onStartPayPal(plan)} />
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
          title="Finance dashboard signals"
          description="Daily rollups for experiments, without persisting merchant descriptions."
        >
          <Card theme={theme}>
            <View style={{ gap: 10 }}>
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: theme.accent }]}
                activeOpacity={0.9}
                onPress={refreshFinanceRollup}
              >
                <Text style={styles.primaryButtonText}>View finance dashboard</Text>
              </TouchableOpacity>
              {financeLoading ? <ActivityIndicator color={theme.accent} /> : null}
              {financeError ? (
                <Text style={[styles.cardDescription, { color: theme.subtle }]}>
                  {financeError}
                </Text>
              ) : null}
              {financeRollup ? (
                <View style={{ gap: 8 }}>
                  <Text style={[styles.cardTitle, { color: theme.text }]}>
                    Daily metrics for {financeRollup.date}
                  </Text>
                  <Text style={[styles.cardDescription, { color: theme.subtle }]}>
                    Active subscription: {financeRollup.activeSubscription ? 'Yes' : 'No'}
                  </Text>
                  <Text style={[styles.cardDescription, { color: theme.subtle }]}>
                    Connected accounts: {financeRollup.connectedAccountsCount}
                  </Text>
                  <Text style={[styles.cardDescription, { color: theme.subtle }]}>
                    30d transactions: {financeRollup.txCount30d}
                  </Text>
                  <Text style={[styles.cardDescription, { color: theme.subtle }]}>
                    30d income: ${financeRollup.totalIncome30d?.toFixed(2) || '0.00'}
                  </Text>
                  <Text style={[styles.cardDescription, { color: theme.subtle }]}>
                    30d spend: ${financeRollup.totalSpend30d?.toFixed(2) || '0.00'}
                  </Text>
                  <View style={{ gap: 4 }}>
                    <Text style={[styles.cardDescription, { color: theme.subtle }]}>
                      Top categories (30d):
                    </Text>
                    {financeRollup.topCategories30d?.length ? (
                      financeRollup.topCategories30d.map((cat: any) => (
                        <Text
                          key={cat.category}
                          style={[styles.cardDescription, { color: theme.text }]}
                        >
                          {cat.category} ({cat.count})
                        </Text>
                      ))
                    ) : (
                      <Text style={[styles.cardDescription, { color: theme.subtle }]}>
                        No categories recorded yet.
                      </Text>
                    )}
                  </View>
                </View>
              ) : (
                <Text style={[styles.cardDescription, { color: theme.subtle }]}>
                  Tap to load the latest rollup for your account.
                </Text>
              )}
            </View>
          </Card>
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
          ))}
        </View>
        <View style={styles.quickRow}>
          <SecondaryButton label="Update payment method" theme={theme} onPress={onManagePaymentMethod} />
          <SecondaryButton label="Cancel subscription" theme={theme} onPress={onCancelSubscription} />
        </View>
        {selectedPlan && (
          <Text style={[styles.meta, { color: theme.subtle }]}>
            Selected: {selectedPlan.name} ({checkoutStatus})
          </Text>
        )}
        {payPalState.status === 'awaiting' && payPalState.approvalUrl ? (
          <Text style={[styles.meta, { color: theme.accent }]}>Approve in browser then confirm.</Text>
        ) : null}
        {payPalState.status !== 'idle' && (
          <PrimaryButton label="Confirm PayPal" theme={theme} onPress={onConfirmPayPal} />
        )}
      </Card>

      <Card theme={theme}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>Annual plan & add-ons</Text>
        <Text style={[styles.cardCopy, { color: theme.subtle }]}>
          Upsell to the annual plan to lower fees and bundle add-ons like extra seats or compliance packs.
        </Text>
        {annualPlan ? (
          <View style={[styles.planRow, { borderColor: theme.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.planTitle, { color: theme.text }]}>{annualPlan.name}</Text>
              <Text style={[styles.meta, { color: theme.subtle }]}>
                {annualPlan.description} {annualPlan.billingCycle ? `• ${annualPlan.billingCycle}` : ''}
              </Text>
            </View>
            <Pill theme={theme} label={annualPlan.price} />
            <PrimaryButton label="Switch to annual" theme={theme} onPress={() => onStartCheckout(annualPlan)} />
          </View>
        ) : (
          <Text style={[styles.meta, { color: theme.subtle }]}>Annual pricing will appear when the catalog is loaded.</Text>
        )}
        {addons.length === 0 && <Text style={[styles.meta, { color: theme.subtle }]}>No add-ons loaded.</Text>}
        {addons.map(addon => (
          <View key={addon.id} style={[styles.planRow, { borderColor: theme.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.planTitle, { color: theme.text }]}>{addon.name}</Text>
              <Text style={[styles.meta, { color: theme.subtle }]}>{addon.description}</Text>
            </View>
            <Pill theme={theme} label={addon.price} />
            <PrimaryButton label="Add" theme={theme} onPress={() => onStartCheckout(addon)} />
          </View>
        ))}
      </Card>

      <Card theme={theme}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>Status</Text>
        <Text style={[styles.meta, { color: theme.subtle }]}>Checkout state: {checkoutStatus}</Text>
        <Text style={[styles.meta, { color: theme.subtle }]}>PayPal status: {payPalState.status}</Text>
        <Text style={[styles.meta, { color: theme.subtle }]}>Payment method: Managed via backend tokens.</Text>
      </Card>
    </View>
  );
}

function SettingsScreen({
  theme,
  plaidState,
  onCreateLinkToken,
  onExchangeToken,
  onGoToBilling,
  payPalStatus,
}: {
  theme: Theme;
  plaidState: { linkToken: string | null; connected: boolean; accounts: Account[]; lastSync: string };
  onCreateLinkToken: () => void;
  onExchangeToken: () => void;
  onGoToBilling: () => void;
  payPalStatus: string;
}) {
  return (
    <View style={styles.grid}>
      <Card theme={theme}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>Billing</Text>
        <Text style={[styles.cardCopy, { color: theme.subtle }]}>Manage subscriptions, cancellations, and payment methods from the billing center.</Text>
        <PrimaryButton label="Open billing" theme={theme} onPress={onGoToBilling} />
        <Text style={[styles.meta, { color: theme.subtle }]}>Status: {payPalStatus === 'active' ? 'Active subscription' : 'Pending/idle'}</Text>
      </Card>

      <Card theme={theme}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>Connected Accounts (Plaid)</Text>
        <Text style={[styles.cardCopy, { color: theme.subtle }]}>Issue a link token, complete Plaid Link, and keep the connection read-only for finance insights.</Text>
        <View style={styles.quickRow}>
          <PrimaryButton label="Create link token" theme={theme} onPress={onCreateLinkToken} />
          <SecondaryButton label="Mark linked" theme={theme} onPress={onExchangeToken} />
        </View>
        <Text style={[styles.meta, { color: theme.subtle }]}>Link token: {plaidState.linkToken ? 'Issued' : 'Not created'}</Text>
        <Text style={[styles.meta, { color: theme.subtle }]}>Connection: {plaidState.connected ? 'Connected (read-only)' : 'Not connected'}</Text>
        <View style={styles.accountList}>
          {plaidState.accounts.map(account => (
            <View key={account.id} style={[styles.planRow, { borderColor: theme.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.planTitle, { color: theme.text }]}>{account.institution}</Text>
                <Text style={[styles.meta, { color: theme.subtle }]}>
                  {account.type} •••• {account.lastFour} ({account.status})
                </Text>
              </View>
              <Pill theme={theme} label="View only" />
            </View>
          ))}
        </View>
      </Card>

      <Card theme={theme}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>Integrations (CRM webhooks)</Text>
        <Text style={[styles.cardCopy, { color: theme.subtle }]}>
          Configure webhook destinations for CRM updates. Webhooks send subscription and payout events to downstream systems.
        </Text>
        <Text style={[styles.meta, { color: theme.subtle }]}>Destinations: HubSpot, Salesforce, or custom HTTPS endpoints.</Text>
        <Text style={[styles.meta, { color: theme.subtle }]}>Status: Enabled via backend routing.</Text>
      </Card>
    </View>
  );
}

function FinanceScreen({
  theme,
  plaidState,
  transactions,
  onRefreshFeed,
}: {
  theme: Theme;
  plaidState: { linkToken: string | null; connected: boolean; accounts: Account[]; lastSync: string };
  transactions: Transaction[];
  onRefreshFeed: () => void;
}) {
  return (
    <View style={styles.grid}>
      <Card theme={theme}>
        <View style={styles.cardHeaderRow}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Balances & accounts</Text>
          <TouchableOpacity onPress={onRefreshFeed}>
            <Text style={[styles.link, { color: theme.accent }]}>Refresh feed</Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.cardCopy, { color: theme.subtle }]}>
          View-only dashboard sourced from Plaid. No edit or payment actions are available.
        </Text>
        <Text style={[styles.meta, { color: theme.subtle }]}>Connection: {plaidState.connected ? 'Active' : 'Not linked'}</Text>
        <Text style={[styles.meta, { color: theme.subtle }]}>Last sync: {plaidState.lastSync}</Text>
        <View style={styles.accountList}>
          {plaidState.accounts.map(account => (
            <View key={account.id} style={[styles.planRow, { borderColor: theme.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.planTitle, { color: theme.text }]}>{account.institution}</Text>
                <Text style={[styles.meta, { color: theme.subtle }]}>
                  {account.type} •••• {account.lastFour}
                </Text>
              </View>
              <Pill theme={theme} label="Read only" />
            </View>
          ))}
        </View>
      </Card>

      <Card theme={theme}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>Transactions</Text>
        <Text style={[styles.cardCopy, { color: theme.subtle }]}>
          Recent income and expenses aggregated from Plaid. Editing and payments are intentionally disabled.
        </Text>
        {transactions.map(txn => (
          <View key={txn.id} style={[styles.transactionRow, { borderColor: theme.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.planTitle, { color: theme.text }]}>{txn.name}</Text>
              <Text style={[styles.meta, { color: theme.subtle }]}>{txn.category}</Text>
            </View>
            <Text style={[styles.amount, { color: txn.amount.startsWith('+') ? '#16A34A' : '#DC2626' }]}>{txn.amount}</Text>
            <Text style={[styles.meta, { color: theme.subtle }]}>{txn.date}</Text>
          </View>
        ))}
      </Card>
    </View>
  );
}

function Card({ theme, children }: { theme: Theme; children: React.ReactNode }) {
  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      {children}
    </View>
  );
}

function Pill({ label, theme }: { label: string; theme: Theme }) {
  return (
    <View style={[styles.pill, { backgroundColor: theme.accentSoft }]}>
      <Text style={[styles.pillText, { color: theme.accent }]}>{label}</Text>
    </View>
  );
}

function PrimaryButton({ label, onPress, theme }: { label: string; onPress: () => void; theme: Theme }) {
  return (
    <TouchableOpacity style={[styles.primaryButton, { backgroundColor: theme.accent }]} onPress={onPress}>
      <Text style={styles.primaryButtonText}>{label}</Text>
    </TouchableOpacity>
  );
}

function SecondaryButton({ label, onPress, theme }: { label: string; onPress: () => void; theme: Theme }) {
  return (
    <TouchableOpacity
      style={[styles.secondaryButton, { borderColor: theme.border, backgroundColor: theme.card }]}
      onPress={onPress}
    >
      <Text style={[styles.secondaryButtonText, { color: theme.text }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function Banner({ theme, message }: { theme: Theme; message: string }) {
  return (
    <View style={[styles.banner, { borderColor: theme.border, backgroundColor: theme.accentSoft }]}>
      <Text style={[styles.meta, { color: theme.text }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  scrollContent: {
    paddingBottom: 28,
    gap: 16,
  },
  header: {
    paddingVertical: 12,
    gap: 10,
  },
  appTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  appSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  grid: {
    gap: 12,
  },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  cardCopy: {
    fontSize: 14,
    lineHeight: 20,
  },
  meta: {
    fontSize: 12,
    lineHeight: 18,
  },
  quickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  primaryButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  primaryButtonText: {
    color: '#0B1222',
    fontWeight: '800',
  },
  secondaryButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontWeight: '700',
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 0,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  planList: {
    gap: 10,
  },
  planRow: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  planTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  link: {
    fontWeight: '700',
  },
  errorText: {
    fontWeight: '700',
  },
  accountList: {
    gap: 10,
    marginTop: 6,
  },
  transactionRow: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  amount: {
    fontWeight: '800',
    minWidth: 80,
    textAlign: 'right',
  },
  banner: {
    padding: 10,
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 8,
  },
});

export default App;
