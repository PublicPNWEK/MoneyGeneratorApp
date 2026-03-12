import { useState } from 'react';
import './OnboardingWizard.css';

type OnboardingStep = 'welcome' | 'platforms' | 'bank' | 'goals' | 'plan' | 'complete';

interface OnboardingWizardProps {
  onComplete: () => void;
  onConnectBank: () => void;
  onSelectPlan: (planId: string) => void;
  onConnectPlatform?: (platformId: string) => void;
  onSetGoal?: (goal: { type: string; target: number }) => void;
}

const PLATFORMS = [
  { id: 'uber', name: 'Uber', icon: '🚗', category: 'Rideshare' },
  { id: 'lyft', name: 'Lyft', icon: '🚙', category: 'Rideshare' },
  { id: 'doordash', name: 'DoorDash', icon: '🍔', category: 'Delivery' },
  { id: 'ubereats', name: 'Uber Eats', icon: '🍕', category: 'Delivery' },
  { id: 'instacart', name: 'Instacart', icon: '🛒', category: 'Delivery' },
  { id: 'grubhub', name: 'Grubhub', icon: '🥡', category: 'Delivery' },
  { id: 'taskrabbit', name: 'TaskRabbit', icon: '🔧', category: 'Tasks' },
  { id: 'fiverr', name: 'Fiverr', icon: '💼', category: 'Freelance' },
  { id: 'upwork', name: 'Upwork', icon: '💻', category: 'Freelance' },
];

const PLANS = [
  {
    id: 'plan_free',
    name: 'Free',
    price: '$0/mo',
    features: ['Basic tracking', 'Manual entry', 'Monthly reports'],
    popular: false,
  },
  {
    id: 'plan_pro',
    name: 'Pro',
    price: '$14.99/mo',
    features: ['Advanced analytics', 'Instant payouts', 'Smart automations', 'Priority support'],
    popular: true,
  },
  {
    id: 'plan_enterprise',
    name: 'Enterprise',
    price: '$49.99/mo',
    features: ['All Pro features', 'Team management', 'Custom integrations', 'Dedicated support'],
    popular: false,
  },
];

const STEP_LABELS: Record<OnboardingStep, string> = {
  welcome: 'Welcome',
  platforms: 'Connect Platforms',
  bank: 'Link Bank',
  goals: 'Set Goals',
  plan: 'Choose Plan',
  complete: 'All Done!',
};

export function OnboardingWizard({ 
  onComplete, 
  onConnectBank, 
  onSelectPlan,
  onConnectPlatform,
  onSetGoal,
}: OnboardingWizardProps) {
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [bankConnected, setBankConnected] = useState(false);
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([]);
  const [weeklyGoal, setWeeklyGoal] = useState<number>(500);
  const [taxReserve, setTaxReserve] = useState<number>(25);

  const steps: OnboardingStep[] = ['welcome', 'platforms', 'bank', 'goals', 'plan', 'complete'];
  const currentIndex = steps.indexOf(step);
  const progress = ((currentIndex + 1) / steps.length) * 100;

  const handleNext = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < steps.length) {
      setStep(steps[nextIndex]);
    }
  };

  const handleBack = () => {
    const prevIndex = currentIndex - 1;
    if (prevIndex >= 0) {
      setStep(steps[prevIndex]);
    }
  };

  const handleConnectBank = () => {
    onConnectBank();
    setBankConnected(true);
  };

  const handlePlatformToggle = (platformId: string) => {
    setConnectedPlatforms(prev => {
      if (prev.includes(platformId)) {
        return prev.filter(p => p !== platformId);
      }
      onConnectPlatform?.(platformId);
      return [...prev, platformId];
    });
  };

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
    onSelectPlan(planId);
  };

  const handleGoalSave = () => {
    onSetGoal?.({ type: 'weekly_earnings', target: weeklyGoal });
    handleNext();
  };

  const handleFinish = () => {
    localStorage.setItem('onboarding_complete', 'true');
    localStorage.setItem('onboarding_data', JSON.stringify({
      platforms: connectedPlatforms,
      bankConnected,
      weeklyGoal,
      taxReserve,
      plan: selectedPlan,
      completedAt: new Date().toISOString(),
    }));
    onComplete();
  };

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-wizard">
        <div className="onboarding-progress">
          <div className="progress-bar" style={{ width: `${progress}%` }} />
        </div>

        <div className="onboarding-step-label">
          Step {currentIndex + 1} of {steps.length}: {STEP_LABELS[step]}
        </div>

        <div className="onboarding-content">
          {step === 'welcome' && (
            <div className="onboarding-step">
              <div className="step-icon">👋</div>
              <h2>Welcome to Money Generator</h2>
              <p>
                Transform your gig economy earnings with smart tracking, instant insights,
                and powerful automations. Let's get you set up in just a few steps.
              </p>
              <div className="value-props">
                <div className="value-prop">
                  <span className="prop-icon">📊</span>
                  <span>Real-time earnings tracking</span>
                </div>
                <div className="value-prop">
                  <span className="prop-icon">🏦</span>
                  <span>Bank account integration</span>
                </div>
                <div className="value-prop">
                  <span className="prop-icon">💡</span>
                  <span>AI-powered insights</span>
                </div>
                <div className="value-prop">
                  <span className="prop-icon">💰</span>
                  <span>Auto tax savings</span>
                </div>
              </div>
              <button className="btn-primary btn-large" onClick={handleNext}>
                Get Started
              </button>
              <p className="setup-time">Setup takes about 3 minutes</p>
            </div>
          )}

          {step === 'platforms' && (
            <div className="onboarding-step onboarding-step-wide">
              <div className="step-icon">📱</div>
              <h2>Connect Your Gig Platforms</h2>
              <p>
                Select the platforms you work with. We'll automatically sync your earnings and help optimize your schedule.
              </p>
              <div className="platforms-grid">
                {PLATFORMS.map((platform) => (
                  <div
                    key={platform.id}
                    className={`platform-card ${connectedPlatforms.includes(platform.id) ? 'selected' : ''}`}
                    onClick={() => handlePlatformToggle(platform.id)}
                  >
                    <span className="platform-icon">{platform.icon}</span>
                    <span className="platform-name">{platform.name}</span>
                    <span className="platform-category">{platform.category}</span>
                    {connectedPlatforms.includes(platform.id) && (
                      <span className="platform-check">✓</span>
                    )}
                  </div>
                ))}
              </div>
              <p className="platforms-count">
                {connectedPlatforms.length > 0 
                  ? `${connectedPlatforms.length} platform${connectedPlatforms.length > 1 ? 's' : ''} selected`
                  : 'Select at least one platform'}
              </p>
              <div className="step-nav">
                <button className="btn-back" onClick={handleBack}>Back</button>
                <button className="btn-primary" onClick={handleNext}>
                  {connectedPlatforms.length > 0 ? 'Continue' : 'Skip for now'}
                </button>
              </div>
            </div>
          )}

          {step === 'bank' && (
            <div className="onboarding-step">
              <div className="step-icon">🏦</div>
              <h2>Connect Your Bank</h2>
              <p>
                Link your bank account to automatically track income and expenses.
                We use Plaid for secure, read-only access to your transactions.
              </p>
              <div className="security-badges">
                <span className="badge">🔒 256-bit encryption</span>
                <span className="badge">✓ Read-only access</span>
                <span className="badge">🏛️ Bank-level security</span>
              </div>
              {bankConnected ? (
                <div className="success-message">
                  <span className="success-icon">✓</span>
                  Bank connected successfully!
                </div>
              ) : (
                <button className="btn-primary btn-large" onClick={handleConnectBank}>
                  Connect Bank Account
                </button>
              )}
              <button className="btn-text" onClick={handleNext}>
                {bankConnected ? 'Continue' : 'Skip for now'}
              </button>
              <div className="step-nav">
                <button className="btn-back" onClick={handleBack}>Back</button>
              </div>
            </div>
          )}

          {step === 'goals' && (
            <div className="onboarding-step">
              <div className="step-icon">🎯</div>
              <h2>Set Your Goals</h2>
              <p>
                Define your weekly earnings target and tax savings. We'll help you track progress and stay on target.
              </p>
              
              <div className="goal-input-group">
                <label>Weekly Earnings Goal</label>
                <div className="goal-slider-row">
                  <span className="goal-value">${weeklyGoal}</span>
                  <input
                    type="range"
                    min="100"
                    max="2000"
                    step="50"
                    value={weeklyGoal}
                    onChange={(e) => setWeeklyGoal(Number(e.target.value))}
                    className="goal-slider"
                  />
                </div>
                <p className="goal-hint">
                  That's ${(weeklyGoal * 52).toLocaleString()} per year
                </p>
              </div>

              <div className="goal-input-group">
                <label>Tax Reserve Percentage</label>
                <div className="goal-slider-row">
                  <span className="goal-value">{taxReserve}%</span>
                  <input
                    type="range"
                    min="10"
                    max="40"
                    step="5"
                    value={taxReserve}
                    onChange={(e) => setTaxReserve(Number(e.target.value))}
                    className="goal-slider"
                  />
                </div>
                <p className="goal-hint">
                  We'll auto-save ${Math.round(weeklyGoal * taxReserve / 100)}/week for taxes
                </p>
              </div>

              <div className="step-nav">
                <button className="btn-back" onClick={handleBack}>Back</button>
                <button className="btn-primary" onClick={handleGoalSave}>
                  Save & Continue
                </button>
              </div>
            </div>
          )}

          {step === 'plan' && (
            <div className="onboarding-step onboarding-step-wide">
              <h2>Choose Your Plan</h2>
              <p>Select the plan that fits your needs. You can always upgrade later.</p>
              <div className="plans-grid">
                {PLANS.map((plan) => (
                  <div
                    key={plan.id}
                    className={`plan-card ${selectedPlan === plan.id ? 'selected' : ''} ${plan.popular ? 'popular' : ''}`}
                    onClick={() => handlePlanSelect(plan.id)}
                  >
                    {plan.popular && <span className="popular-badge">Most Popular</span>}
                    <h3>{plan.name}</h3>
                    <div className="plan-price">{plan.price}</div>
                    <ul className="plan-features">
                      {plan.features.map((feature, i) => (
                        <li key={i}>
                          <span className="check">✓</span> {feature}
                        </li>
                      ))}
                    </ul>
                    <button
                      className={`btn-plan ${selectedPlan === plan.id ? 'btn-selected' : ''}`}
                    >
                      {selectedPlan === plan.id ? 'Selected' : 'Select Plan'}
                    </button>
                  </div>
                ))}
              </div>
              <div className="step-nav">
                <button className="btn-back" onClick={handleBack}>Back</button>
                <button
                  className="btn-primary"
                  onClick={handleNext}
                  disabled={!selectedPlan}
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === 'complete' && (
            <div className="onboarding-step">
              <div className="step-icon">🎉</div>
              <h2>You're All Set!</h2>
              <p>
                Your account is ready. Here's your personalized first-week checklist:
              </p>
              <div className="completion-summary">
                <div className="summary-item">
                  <span className="summary-icon">📱</span>
                  <span>{connectedPlatforms.length} platform{connectedPlatforms.length !== 1 ? 's' : ''} connected</span>
                </div>
                <div className="summary-item">
                  <span className="summary-icon">🏦</span>
                  <span>{bankConnected ? 'Bank linked' : 'Bank not linked'}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-icon">🎯</span>
                  <span>${weeklyGoal}/week goal</span>
                </div>
                <div className="summary-item">
                  <span className="summary-icon">💰</span>
                  <span>{taxReserve}% tax reserve</span>
                </div>
              </div>
              <div className="next-steps">
                <h4>First Week Checklist:</h4>
                <ul className="checklist">
                  <li>
                    <input type="checkbox" id="check1" />
                    <label htmlFor="check1">Record your first day of earnings</label>
                  </li>
                  <li>
                    <input type="checkbox" id="check2" />
                    <label htmlFor="check2">Log your mileage for tax deductions</label>
                  </li>
                  <li>
                    <input type="checkbox" id="check3" />
                    <label htmlFor="check3">Enable surge alerts for your area</label>
                  </li>
                  <li>
                    <input type="checkbox" id="check4" />
                    <label htmlFor="check4">Download the mobile app</label>
                  </li>
                </ul>
              </div>
              <button className="btn-primary btn-large" onClick={handleFinish}>
                Go to Dashboard
              </button>
            </div>
          )}
        </div>

        <div className="onboarding-steps-indicator">
          {steps.map((s, i) => (
            <div
              key={s}
              className={`step-indicator ${i < currentIndex ? 'completed' : ''} ${i === currentIndex ? 'active' : ''}`}
              title={STEP_LABELS[s]}
            >
              {i < currentIndex ? '✓' : i + 1}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
