import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { backendClient } from './app/services/backend';
import { analytics } from './app/services/analytics';

export type Product = {
  id: string;
  type: string;
  name: string;
  description: string;
  price: string;
};

type Theme = {
  background: string;
  card: string;
  text: string;
  subtle: string;
  border: string;
  accent: string;
};

const catalogFallback: Product[] = [
  { id: 'plan_pro', type: 'plan', name: 'Pro Plan', description: 'Full access', price: '$9' },
  { id: 'addon_insights', type: 'addon', name: 'Insights', description: 'Addon', price: '$3' },
];

const financeOverview = [
  { title: 'Financial Liquidity', body: 'EarnIn-style advances with configurable limits.' },
  { title: 'Benefits Safety Net', body: 'Catch-style tax withholding and reserves.' },
  { title: 'Expense Intelligence', body: 'Expensify-grade receipt scanning and exports.' },
];

const metrics = [
  { label: 'Market Trajectory', value: '$2.1T gig economy by 2034' },
  { label: 'Coverage', value: '20+ partner APIs' },
  { label: 'Payout latency', value: '< 60s to card' },
];

const lightTheme: Theme = {
  background: '#F5F7FB',
  card: '#FFFFFF',
  text: '#0B1222',
  subtle: '#4B5563',
  border: '#E5E7EB',
  accent: '#2563EB',
};

const darkTheme: Theme = {
  background: '#0B1222',
  card: '#11182B',
  text: '#F8FAFC',
  subtle: '#AAB3C5',
  border: '#1F2937',
  accent: '#60A5FA',
};

export default function App() {
  const colorScheme = useColorScheme();
  const theme = useMemo(() => (colorScheme === 'dark' ? darkTheme : lightTheme), [colorScheme]);

  const [view, setView] = useState<'home' | 'shop' | 'billing' | 'finance'>('home');
  const [catalog, setCatalog] = useState<Product[]>(catalogFallback);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Product | null>(null);

  useEffect(() => {
    backendClient.fetchEntitlements?.();
    analytics.track?.({ name: 'app_viewed' });
  }, []);

  useEffect(() => {
    if (view === 'shop' || view === 'billing') {
      loadCatalog();
    }
  }, [view]);

  const loadCatalog = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await backendClient.fetchCatalog();
      const products = res?.products?.length ? res.products : catalogFallback;
      setCatalog(products);
    } catch (err: any) {
      setError(err?.message || 'Unable to load catalog');
      setCatalog(catalogFallback);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!selectedPlan) return;
    setLoading(true);
    try {
      await backendClient.purchase(selectedPlan.id, 'demo-user');
      await backendClient.fetchEntitlements?.();
      analytics.track?.({ name: 'purchase_completed', payload: { productId: selectedPlan.id } });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaProvider>
      <View style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={[styles.title, { color: theme.text }]}>Money Generator</Text>
          <Text style={[styles.subtitle, { color: theme.subtle }]}>Control center for billing and finance.</Text>

          <View style={styles.actionRow}>
            <PrimaryButton label="Open Shop" theme={theme} onPress={() => setView('shop')} />
            <SecondaryButton label="Settings → Billing" theme={theme} onPress={() => setView('billing')} />
            <SecondaryButton label="Finance Overview" theme={theme} onPress={() => setView('finance')} />
          </View>

          {view === 'home' && <FinanceIntro theme={theme} />}

          {view === 'shop' && (
            <Shop
              theme={theme}
              catalog={catalog}
              loading={loading}
              error={error}
              onRefresh={loadCatalog}
              onSelect={plan => {
                setSelectedPlan(plan);
                setView('billing');
              }}
            />
          )}

          {view === 'billing' && (
            <Billing
              theme={theme}
              catalog={catalog}
              loading={loading}
              selectedPlan={selectedPlan}
              onSelect={setSelectedPlan}
              onConfirm={handlePurchase}
            />
          )}

          <FinancePanel theme={theme} />
        </ScrollView>
      </View>
    </SafeAreaProvider>
  );
}

function FinanceIntro({ theme }: { theme: Theme }) {
  return (
    <View style={[styles.card, { borderColor: theme.border, backgroundColor: theme.card }]}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Welcome back</Text>
      <Text style={[styles.body, { color: theme.subtle }]}>Navigate to shop, billing, or finance to explore mocked flows.</Text>
    </View>
  );
}

function Shop({
  theme,
  catalog,
  loading,
  error,
  onRefresh,
  onSelect,
}: {
  theme: Theme;
  catalog: Product[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onSelect: (product: Product) => void;
}) {
  return (
    <View style={[styles.card, { borderColor: theme.border, backgroundColor: theme.card }]}> 
      <View style={styles.cardHeader}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Shop</Text>
        <SecondaryButton label="Refresh" theme={theme} onPress={onRefresh} />
      </View>
      {loading && <ActivityIndicator color={theme.accent} />} 
      {error && <Text style={[styles.error, { color: theme.accent }]}>{error}</Text>} 
      {catalog.map(item => (
        <View key={item.id} style={styles.listItem}>
          <View>
            <Text style={[styles.itemTitle, { color: theme.text }]}>{item.name}</Text>
            <Text style={[styles.body, { color: theme.subtle }]}>{item.description}</Text>
          </View>
          <PrimaryButton label="Select" theme={theme} onPress={() => onSelect(item)} />
        </View>
      ))}
    </View>
  );
}

function Billing({
  theme,
  catalog,
  loading,
  selectedPlan,
  onSelect,
  onConfirm,
}: {
  theme: Theme;
  catalog: Product[];
  loading: boolean;
  selectedPlan: Product | null;
  onSelect: (product: Product) => void;
  onConfirm: () => void;
}) {
  return (
    <View style={[styles.card, { borderColor: theme.border, backgroundColor: theme.card }]}> 
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Billing</Text>
      {catalog.map(item => (
        <View key={item.id} style={styles.listItem}>
          <View>
            <Text style={[styles.itemTitle, { color: theme.text }]}>{item.name}</Text>
            <Text style={[styles.body, { color: theme.subtle }]}>{item.price}</Text>
          </View>
          <PrimaryButton
            label={selectedPlan?.id === item.id ? 'Selected' : 'Select'}
            theme={theme}
            onPress={() => onSelect(item)}
          />
        </View>
      ))}
      <PrimaryButton
        label="Confirm Purchase"
        theme={theme}
        onPress={onConfirm}
        disabled={!selectedPlan || loading}
      />
    </View>
  );
}

function FinancePanel({ theme }: { theme: Theme }) {
  return (
    <View style={[styles.card, { borderColor: theme.border, backgroundColor: theme.card }]}> 
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Finance Overview</Text>
      {financeOverview.map(item => (
        <View key={item.title} style={styles.listItem}>
          <Text style={[styles.itemTitle, { color: theme.text }]}>{item.title}</Text>
          <Text style={[styles.body, { color: theme.subtle }]}>{item.body}</Text>
        </View>
      ))}
      <View style={styles.metricRow}>
        {metrics.map(metric => (
          <View key={metric.label} style={styles.metricCard}>
            <Text style={[styles.body, { color: theme.subtle }]}>{metric.label}</Text>
            <Text style={[styles.itemTitle, { color: theme.text }]}>{metric.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function PrimaryButton({ label, theme, onPress, disabled }: { label: string; theme: Theme; onPress: () => void; disabled?: boolean }) {
  return (
    <TouchableOpacity
      onPress={disabled ? undefined : onPress}
      style={[styles.button, { backgroundColor: disabled ? '#CBD5E1' : theme.accent }]}
      disabled={disabled}
    >
      <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function SecondaryButton({ label, theme, onPress }: { label: string; theme: Theme; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.button, styles.secondaryButton, { borderColor: theme.border }]}>
      <Text style={[styles.buttonText, { color: theme.text }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { padding: 16, gap: 12 },
  title: { fontSize: 22, fontWeight: '800' },
  subtitle: { fontSize: 14 },
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  card: { borderWidth: 1, borderRadius: 12, padding: 12, gap: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  body: { fontSize: 14, lineHeight: 20 },
  listItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  itemTitle: { fontSize: 16, fontWeight: '700' },
  link: { fontWeight: '700' },
  button: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10 },
  buttonText: { fontWeight: '700', fontSize: 14 },
  secondaryButton: { backgroundColor: '#F1F5F9', borderWidth: 1 },
  error: { marginVertical: 6, fontWeight: '700' },
  metricRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  metricCard: { padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', minWidth: '45%' },
});
