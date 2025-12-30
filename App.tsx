import React from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

type Highlight = {
  title: string;
  items: string[];
};

type Card = {
  title: string;
  subtitle: string;
  bullets?: string[];
  tag?: string;
};

const jobBoardCategories: Card[] = [
  {
    title: 'Local Missions',
    subtitle: 'TaskRabbit, Instawork, handyman and on-demand errand work.',
    bullets: ['Geofenced availability', 'Instant cash-out toggle', 'Mileage tracker'],
    tag: 'Location-first',
  },
  {
    title: 'Digital Services',
    subtitle: 'Fiverr, Upwork, Contra, and niche marketplaces for specialized work.',
    bullets: ['Portfolio-forward profiles', 'Reusable proposal templates', 'Cross-platform rating sync'],
    tag: 'Remote',
  },
  {
    title: 'Shift-Based Ops',
    subtitle: 'Rideshare, delivery, warehouse shifts, and hospitality gigs.',
    bullets: ['Shift bidding', 'Live earnings heatmap', 'Optimal route guidance'],
    tag: 'Real-time',
  },
];

const workflowBundles: Highlight[] = [
  {
    title: 'Smart Workflows',
    items: [
      'Delivery Mode: mileage + fuel cost tracking, surge alerts, rest timers.',
      'Freelance Mode: contract templates, time tracking, milestone billing.',
      'Support Mode: ticket queues, canned responses, on-call calendar sync.',
    ],
  },
  {
    title: 'Automation',
    items: [
      'Auto-create expenses from receipts, invoices, and bank feeds.',
      'Prebuilt Zapier/Make triggers for payouts, offers, and KYC approvals.',
      'Usage-based throttling aligned to subscription tier and SLA.',
    ],
  },
];

const financialStack: Card[] = [
  {
    title: 'Financial Liquidity',
    subtitle: 'EarnIn-style advances with configurable limits (up to $150/day).',
    bullets: ['Instant payout rails', 'Eligibility scoring per provider', 'Transparent fees + markup'],
    tag: 'Cash Out',
  },
  {
    title: 'Benefits Safety Net',
    subtitle: 'Catch-style tax withholding, health, retirement, and rainy-day buckets.',
    bullets: ['Auto-reserve % of earnings', 'Portable benefits per gig', 'Audit-ready receipts'],
    tag: 'Benefits',
  },
  {
    title: 'Expense Intelligence',
    subtitle: 'Expensify-grade receipt scanning and mileage logging.',
    bullets: ['Card-level enrichment', 'Policy rules by tier', 'CSV + API exports'],
    tag: 'Expenses',
  },
];

const integrationHub: Highlight[] = [
  {
    title: 'Unified API Gateway',
    items: [
      'Single Master Key per user -> routed to enterprise providers behind the scenes.',
      'Provider selection logic (Stripe vs Unit) based on tier, geo, and limits.',
      'Centralized observability: latency, error budgets, and per-API markup.',
    ],
  },
  {
    title: 'White-Label Marketplace',
    items: [
      '3P tools listed as plugins with revenue share (15–30% markup).',
      'Configurable bundles for industries (writers, drivers, technicians).',
      'Rate-limit tiers: Free, Pro, and Enterprise with burst tokens.',
    ],
  },
];

const monetization: Highlight[] = [
  {
    title: 'Cost-Plus Billing',
    items: [
      'Utility markup on wholesale APIs (15–30%).',
      'Transaction fees on instant payouts and cross-wallet transfers.',
      'Float yield on staged funds where regulation allows.',
    ],
  },
  {
    title: 'Subscriptions & Add-ons',
    items: [
      'Freemium tracking, Pro analytics ($10–$20/mo), Enterprise SLAs.',
      'Optional compliance packs: KYC, KYB, fraud rules, PEP/sanctions checks.',
      'Add-on seats for collaborators, clients, or fleet managers.',
    ],
  },
];

const compliance: Highlight[] = [
  {
    title: 'Guardrails',
    items: [
      'Enterprise/API partner agreements only—no personal key resale.',
      'Full KYC/KYB prior to key issuance; velocity checks for fraud.',
      'GDPR/CCPA-ready data handling with scoped tokens and rotation.',
    ],
  },
  {
    title: 'Operational Playbooks',
    items: [
      'Incident response with automated provider failover.',
      'Service health SLOs per integration and per user tier.',
      'Audit trails for every routed request and pricing decision.',
    ],
  },
];

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

function Pill({ label }: { label: string }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillText}>{label}</Text>
    </View>
  );
}

function CardList({ cards }: { cards: Card[] }) {
  return (
    <View style={styles.cardGrid}>
      {cards.map(card => (
        <View key={card.title} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{card.title}</Text>
            {card.tag ? <Pill label={card.tag} /> : null}
          </View>
          <Text style={styles.cardSubtitle}>{card.subtitle}</Text>
          {card.bullets ? (
            <View style={styles.bulletList}>
              {card.bullets.map(item => (
                <View key={item} style={styles.bulletRow}>
                  <View style={styles.bulletDot} />
                  <Text style={styles.bulletText}>{item}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      ))}
    </View>
  );
}

function Highlights({ items }: { items: Highlight[] }) {
  return (
    <View style={styles.highlightStack}>
      {items.map(block => (
        <View key={block.title} style={styles.highlightCard}>
          <Text style={styles.highlightTitle}>{block.title}</Text>
          {block.items.map(item => (
            <View key={item} style={styles.bulletRow}>
              <View style={styles.bulletDot} />
              <Text style={styles.bulletText}>{item}</Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

function Hero() {
  return (
    <View style={styles.hero}>
      <Text style={styles.heroBadge}>Unified Gig OS</Text>
      <Text style={styles.heroTitle}>Money Generator: Master Key Marketplace</Text>
      <Text style={styles.heroSubtitle}>
        Build once, deploy everywhere. A single control center for earning, managing, and
        thriving—combining job aggregation, smart workflows, and a unified API gateway with
        markup-ready billing.
      </Text>
      <View style={styles.heroTags}>
        <Pill label="Job Boards" />
        <Pill label="Workflows" />
        <Pill label="Fintech" />
        <Pill label="API Gateway" />
      </View>
    </View>
  );
}

function MetricStrip() {
  const metrics = [
    { label: 'Market Trajectory', value: '$2.1T gig economy by 2034' },
    { label: 'Key Value', value: 'One Master Key for every provider' },
    { label: 'Monetization', value: 'Subscriptions + usage markup + commissions' },
  ];

  return (
    <View style={styles.metricStrip}>
      {metrics.map(metric => (
        <View key={metric.label} style={styles.metricItem}>
          <Text style={styles.metricLabel}>{metric.label}</Text>
          <Text style={styles.metricValue}>{metric.value}</Text>
        </View>
      ))}
    </View>
  );
}

function MasterKeyFlow() {
  const steps = [
    'User clicks Instant Cash Out.',
    'Gateway validates Master Token + subscription tier.',
    'Router selects provider (Stripe, Unit, or partner) and applies markup.',
    'Execution with enterprise credentials; audit trail + analytics logged.',
  ];

  return (
    <View style={styles.flowCard}>
      <Text style={styles.flowTitle}>Master Key Flow</Text>
      {steps.map(step => (
        <View key={step} style={styles.flowRow}>
          <View style={styles.flowIndex}>
            <Text style={styles.flowIndexText}>{steps.indexOf(step) + 1}</Text>
          </View>
          <Text style={styles.flowText}>{step}</Text>
        </View>
      ))}
    </View>
  );
}

function Roadmap() {
  const milestones: Card[] = [
    {
      title: 'MVP Launch',
      subtitle: 'Unified job feed, smart workflows, and Master Key auth with sandbox providers.',
      bullets: ['Job aggregation + filtering', 'Basic payouts & expense capture', 'Tiered access and rate limits'],
      tag: 'Now',
    },
    {
      title: 'Scale',
      subtitle: 'Bring on enterprise partners, expand plugins, and deepen analytics.',
      bullets: ['Provider redundancy + failover', 'Marketplace revenue share', 'Universal gig reputation graph'],
      tag: 'Next',
    },
    {
      title: 'Enterprise',
      subtitle: 'OEM-ready white-label kits for platforms and staffing firms.',
      bullets: ['Co-branded portals', 'Custom SLAs', 'Compliance attestation + audits'],
      tag: 'Later',
    },
  ];

  return <CardList cards={milestones} />;
}

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

  return (
    <View style={[styles.container, { paddingTop: safeAreaInsets.top }]}> 
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Hero />
        <MetricStrip />

        <SectionHeader
          title="Categorized Job Boards"
          subtitle="Unified feed for TaskRabbit-style local work, Fiverr-grade digital jobs, and shift-based ops."
        />
        <CardList cards={jobBoardCategories} />

        <SectionHeader
          title="Use-Case Workflows & Automation"
          subtitle="Prebuilt modes adapt to the active gig, with automation hooks ready for deployment."
        />
        <Highlights items={workflowBundles} />

        <SectionHeader
          title="Financial Management Stack"
          subtitle="Liquidity, benefits, and expense intelligence bundled into the Money Generator."
        />
        <CardList cards={financialStack} />

        <SectionHeader
          title="Integration Hub & White-Label Platform"
          subtitle="Curated plugin marketplace backed by a unified API gateway and provider-aware routing."
        />
        <Highlights items={integrationHub} />

        <SectionHeader
          title="Master Key Architecture"
          subtitle="Facade routing, per-tier rate limits, and markup-ready billing across every provider."
        />
        <MasterKeyFlow />

        <SectionHeader
          title="Monetization Engine"
          subtitle="Blend subscriptions, cost-plus usage, marketplace commissions, and payout fees."
        />
        <Highlights items={monetization} />

        <SectionHeader
          title="Compliance & Resilience"
          subtitle="Enterprise-grade guardrails to avoid reseller traps and stay audit-ready."
        />
        <Highlights items={compliance} />

        <SectionHeader
          title="Launch Roadmap"
          subtitle="From MVP aggregation to enterprise white-label deployments."
        />
        <Roadmap />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c1220',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
    gap: 20,
  },
  hero: {
    backgroundColor: '#111a2d',
    borderRadius: 20,
    padding: 20,
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#243657',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    color: '#d8e3ff',
    fontSize: 12,
    fontWeight: '600',
  },
  heroTitle: {
    color: '#f7fbff',
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 32,
  },
  heroSubtitle: {
    color: '#c7d6f6',
    fontSize: 15,
    lineHeight: 22,
  },
  heroTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sectionHeader: {
    gap: 6,
  },
  sectionTitle: {
    color: '#f2f6ff',
    fontSize: 20,
    fontWeight: '700',
  },
  sectionSubtitle: {
    color: '#b8c8e8',
    fontSize: 14,
    lineHeight: 20,
  },
  cardGrid: {
    gap: 12,
  },
  card: {
    backgroundColor: '#121b2e',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    color: '#f5f8ff',
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  cardSubtitle: {
    color: '#c2d2f2',
    fontSize: 14,
    lineHeight: 20,
  },
  bulletList: {
    gap: 6,
    marginTop: 4,
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
    backgroundColor: '#5ea8ff',
    marginTop: 2,
  },
  bulletText: {
    color: '#d4e2ff',
    fontSize: 13,
    lineHeight: 19,
    flex: 1,
  },
  pill: {
    backgroundColor: '#1d2b45',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  pillText: {
    color: '#bcd4ff',
    fontSize: 12,
    fontWeight: '600',
  },
  highlightStack: {
    gap: 12,
  },
  highlightCard: {
    backgroundColor: '#10192c',
    borderRadius: 14,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  highlightTitle: {
    color: '#f5f7ff',
    fontSize: 15,
    fontWeight: '700',
  },
  metricStrip: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  metricItem: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: '#142035',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  metricLabel: {
    color: '#9fb5dd',
    fontSize: 12,
    marginBottom: 4,
    fontWeight: '600',
  },
  metricValue: {
    color: '#e9f1ff',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  flowCard: {
    backgroundColor: '#101a2d',
    borderRadius: 16,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  flowTitle: {
    color: '#f5f8ff',
    fontSize: 16,
    fontWeight: '700',
  },
  flowRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  flowIndex: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: '#1c2b45',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flowIndexText: {
    color: '#a5c6ff',
    fontWeight: '700',
  },
  flowText: {
    color: '#d6e5ff',
    fontSize: 13,
    lineHeight: 19,
    flex: 1,
  },
});

export default App;
