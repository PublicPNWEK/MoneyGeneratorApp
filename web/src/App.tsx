import { useEffect, useState, useCallback } from 'react';
import { OnboardingWizard } from './components/OnboardingWizard';
import { ToastProvider, useToast } from './components/Toast';
import { Checkout } from './components/Checkout';
import { Dashboard } from './components/Dashboard';
import './App.css';

type Product = {
  id: string;
  type: string;
  name: string;
  price: string;
  description: string;
};

type UserProfile = {
  bankConnected: boolean;
  subscription: string | null;
  earnings: number;
  weeklyChange: number;
};

const DEMO_PRODUCTS: Product[] = [
  {
    id: 'plan_pro',
    type: 'plan',
    name: 'Pro Plan',
    price: '$14.99/mo',
    description: 'Advanced analytics, instant payouts, and smart automations to maximize your earnings.',
  },
  {
    id: 'addon_shift_insights',
    type: 'addon',
    name: 'Shift Insights',
    price: '$4.99/mo',
    description: 'Deep per-shift profitability analysis and mileage rollups for gig work.',
  },
  {
    id: 'onetime_boost',
    type: 'one_time',
    name: 'Priority Boost',
    price: '$19.99',
    description: 'Get priority placement for 14 days to attract more high-paying opportunities.',
  },
];

function AppContent() {
  const [products, setProducts] = useState<Product[]>(DEMO_PRODUCTS);
  const [apiConnected, setApiConnected] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products'>('dashboard');
  const [userProfile, setUserProfile] = useState<UserProfile>({
    bankConnected: false,
    subscription: null,
    earnings: 2847,
    weeklyChange: 12,
  });

  const { showToast } = useToast();
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';

  useEffect(() => {
    const onboardingComplete = localStorage.getItem('onboarding_complete');
    if (!onboardingComplete) {
      setShowOnboarding(true);
    }
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${apiUrl}/api/catalog`, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data.products && Array.isArray(data.products)) {
          setProducts(data.products);
          setApiConnected(true);
        }
      }
    } catch {
      setApiConnected(false);
    }
  };

  const handleOnboardingComplete = useCallback(() => {
    setShowOnboarding(false);
    showToast('Welcome to Money Generator!', 'success');
  }, [showToast]);

  const handleConnectBank = useCallback(() => {
    showToast('Opening bank connection...', 'info');
    // In production, this would trigger Plaid Link
    setTimeout(() => {
      setUserProfile((prev) => ({ ...prev, bankConnected: true }));
      showToast('Bank account connected successfully!', 'success');
    }, 1500);
  }, [showToast]);

  const handleSelectPlan = useCallback(
    (planId: string, _cycle: string, addons: string[]) => {
      setShowCheckout(false);
      setUserProfile((prev) => ({ ...prev, subscription: planId }));
      const addonText = addons.length > 0 ? ` with ${addons.length} add-on(s)` : '';
      showToast(`Subscribed to ${planId}${addonText}!`, 'success');
    },
    [showToast]
  );

  return (
    <div className="app">
      {showOnboarding && (
        <OnboardingWizard
          onComplete={handleOnboardingComplete}
          onConnectBank={handleConnectBank}
          onSelectPlan={(planId) => {
            setUserProfile((prev) => ({ ...prev, subscription: planId }));
          }}
        />
      )}

      {showCheckout && (
        <Checkout
          currentPlan={userProfile.subscription || undefined}
          onSelectPlan={handleSelectPlan}
          onClose={() => setShowCheckout(false)}
        />
      )}

      <header className="app-header">
        <h1>Money Generator</h1>
        <p className="tagline">Turn time into money with smart job matching</p>
        <div className="health-badge">
          <span className={apiConnected ? 'status-ok' : 'status-demo'}>
            {apiConnected ? '✓ API Connected' : '○ Demo Mode'}
          </span>
        </div>
      </header>

      <nav className="app-nav">
        <button
          className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </button>
        <button
          className={`nav-tab ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          Products
        </button>
      </nav>

      <main className="app-main">
        {activeTab === 'dashboard' && (
          <Dashboard
            earnings={userProfile.earnings}
            weeklyChange={userProfile.weeklyChange}
            bankConnected={userProfile.bankConnected}
            hasSubscription={!!userProfile.subscription}
            onConnectBank={handleConnectBank}
            onUpgrade={() => setShowCheckout(true)}
            onViewAnalytics={() => showToast('Analytics coming soon!', 'info')}
          />
        )}

        {activeTab === 'products' && (
          <>
            <div className="hero">
              <h2>Maximize Your Earnings</h2>
              <p>Choose the plan that works best for your gig economy needs</p>
              <div className="hero-buttons">
                <button className="btn-primary" onClick={() => setShowCheckout(true)}>
                  View Plans
                </button>
                <button className="btn-secondary" onClick={handleConnectBank}>
                  Connect Bank
                </button>
              </div>
            </div>

            <section className="products">
              <h2>Featured Products</h2>
              <div className="products-grid">
                {products.map((product) => (
                  <div key={product.id} className="product-card">
                    <span className="product-type">{product.type}</span>
                    <h3>{product.name}</h3>
                    <p className="product-description">{product.description}</p>
                    <div className="product-footer">
                      <span className="product-price">{product.price}</span>
                      <button
                        className="btn-primary"
                        onClick={() => {
                          if (product.type === 'plan') {
                            setShowCheckout(true);
                          } else {
                            showToast(`Added ${product.name} to cart`, 'success');
                          }
                        }}
                      >
                        Get Started
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </main>

      <footer className="app-footer">
        <p>&copy; 2026 Money Generator App. All rights reserved.</p>
      </footer>
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}

export default App;
