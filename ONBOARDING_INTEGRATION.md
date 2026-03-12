# Onboarding System Integration Guide

## Quick Start

### Step 1: Wrap App with Provider

In [App.tsx](App.tsx), wrap your app with `OnboardingProvider`:

```tsx
import { OnboardingProvider } from './web/src/utils/onboardingSystem';

export default function App() {
  return (
    <OnboardingProvider>
      <AppContent />
    </OnboardingProvider>
  );
}
```

### Step 2: Add Tour to Dashboard

In [web/src/pages/DashboardPageV2.tsx](web/src/pages/DashboardPageV2.tsx), add guided tour:

```tsx
import { 
  GuidedTour, 
  useTourNavigation,
  useOnboarding 
} from '../utils/onboardingSystem';

export default function DashboardPageV2() {
  const { markTutorialWatched } = useOnboarding();

  const dashboardTour = [
    {
      id: 'dashboard-welcome',
      title: 'Welcome to Your Dashboard',
      description: 'Monitor all your financial metrics in one place.',
      highlightSelector: '.dashboard-content',
    },
    {
      id: 'dashboard-metrics',
      title: 'Key Metrics',
      description: 'Track income, expenses, and savings trends.',
      highlightSelector: '.metrics-grid',
    },
    {
      id: 'dashboard-goals',
      title: 'Financial Goals',
      description: 'Set and track your financial targets.',
      highlightSelector: '.goals-section',
    },
  ];

  const tour = useTourNavigation(dashboardTour, () => {
    markTutorialWatched('dashboard-tour');
  });

  return (
    <>
      {tour.isActive && (
        <GuidedTour
          steps={dashboardTour}
          isActive
          currentStepIndex={tour.currentStepIndex}
          onStepChange={tour.goToStep}
          onComplete={tour.skipTour}
          onSkip={tour.skipTour}
        />
      )}
      
      {/* Existing dashboard content */}
      <div className="dashboard-content">
        {/* ... */}
      </div>

      {/* Tour trigger button */}
      <button 
        className="guided-tour-trigger"
        onClick={tour.startTour}
        aria-label="Start dashboard guide"
      >
        🎯 Start Guide
      </button>
    </>
  );
}
```

### Step 3: Add Checklist to Onboarding

In [web/src/components/OnboardingWizard.tsx](web/src/components/OnboardingWizard.tsx), integrate the checklist:

```tsx
import { 
  OnboardingChecklist,
  useCheckpointProgress 
} from '../utils/onboardingSystem';

export default function OnboardingWizard() {
  const progress = useCheckpointProgress();

  return (
    <div className="onboarding-wizard">
      {/* Existing wizard steps */}
      {currentStep < totalSteps && (
        <WizardStep />
      )}

      {/* Show checklist after initial setup */}
      {completedInitialSetup && (
        <div className="checklist-section">
          <h2>Complete Your Setup</h2>
          <OnboardingChecklist 
            title="Your Onboarding Progress"
            showProgress
          />
        </div>
      )}

      {/* Completion screen */}
      {progress.isComplete && (
        <div className="completion-screen">
          <h2>🎉 All Set Up!</h2>
          <p>You're ready to start managing your finances.</p>
        </div>
      )}
    </div>
  );
}
```

### Step 4: Add Help Widget to Layout

In [web/src/layouts/AppLayout.tsx](web/src/layouts/AppLayout.tsx):

```tsx
import { HelpWidget } from '../utils/onboardingSystem';

const faqItems = [
  {
    q: 'How do I connect my bank?',
    a: 'Go to Settings > Bank Account > Connect Bank and follow the secure flow.',
  },
  {
    q: 'Is my data secure?',
    a: 'Yes! We use bank-level encryption (256-bit SSL) and never store your credentials.',
  },
  {
    q: 'How do I reset my password?',
    a: 'Click "Forgot Password" on the login screen or go to Settings > Security.',
  },
  {
    q: 'Can I upgrade/downgrade my plan?',
    a: 'Yes, go to Settings > Subscription to change your plan anytime.',
  },
  {
    q: 'How do I export my data?',
    a: 'Go to Settings > Data & Privacy > Export Data to download your records.',
  },
];

export default function AppLayout() {
  return (
    <>
      {/* Existing layout */}
      <Header />
      <Sidebar />
      <main>{children}</main>

      {/* Add help widget */}
      <HelpWidget 
        position="bottom-right"
        items={faqItems}
      />
    </>
  );
}
```

### Step 5: Add Educational Hints

Add contextual hints to feature pages. In any component:

```tsx
import { EducationalHint } from '../utils/onboardingSystem';
import { Lightbulb, Lock, TrendingUp } from 'lucide-react';

export function SettingsPage() {
  const [dismissedHints, setDismissedHints] = useState<string[]>([]);

  const handleDismiss = (hintId: string) => {
    setDismissedHints([...dismissedHints, hintId]);
  };

  return (
    <div className="settings-page">
      {!dismissedHints.includes('tips') && (
        <EducationalHint
          type="tip"
          title="Pro Tip"
          description="Enable SMS alerts to get notifications about unusual spending."
          icon={<Lightbulb />}
          onDismiss={() => handleDismiss('tips')}
        />
      )}

      {/* Settings content */}
      
      {!dismissedHints.includes('security') && (
        <EducationalHint
          type="warning"
          title="Enhance Security"
          description="Enable two-factor authentication to protect your account."
          icon={<Lock />}
          onDismiss={() => handleDismiss('security')}
        />
      )}
    </div>
  );
}
```

## Integration Checklist

- [ ] Import `OnboardingProvider` in App.tsx
- [ ] Wrap app with provider
- [ ] Add tour to DashboardPageV2.tsx
- [ ] Integrate checklist in OnboardingWizard.tsx
- [ ] Add HelpWidget to AppLayout.tsx
- [ ] Add educational hints to key pages
- [ ] Test dark mode support
- [ ] Test mobile responsiveness
- [ ] Run `npm run build` to verify

## Tour Step Examples

### Example: Income Entry Page Tour

```tsx
const incomeFormTour = [
  {
    id: 'income-title',
    title: 'Add Income Source',
    description: 'Track different sources of income.',
    highlightSelector: '.income-form-header',
  },
  {
    id: 'income-amount',
    title: 'Enter Amount',
    description: 'Input the income amount received.',
    highlightSelector: '.amount-input',
  },
  {
    id: 'income-category',
    title: 'Select Category',
    description: 'Choose or create an income category.',
    highlightSelector: '.category-select',
  },
  {
    id: 'income-date',
    title: 'Set Date',
    description: 'When did you receive this income?',
    highlightSelector: '.date-picker',
  },
  {
    id: 'income-submit',
    title: 'Save Income',
    description: 'Click to save and track this income.',
    highlightSelector: '.submit-button',
    actions: [{ label: 'Try it!', action: () => {} }],
  },
];
```

### Example: Settings Tour

```tsx
const settingsTour = [
  {
    id: 'settings-profile',
    title: 'Profile Settings',
    description: 'Manage your account information.',
    highlightSelector: '[data-tour="profile-section"]',
  },
  {
    id: 'settings-security',
    title: 'Security Settings',
    description: 'Enable 2FA and manage passwords.',
    highlightSelector: '[data-tour="security-section"]',
  },
  {
    id: 'settings-notifications',
    title: 'Notification Preferences',
    description: 'Customize how you receive updates.',
    highlightSelector: '[data-tour="notifications-section"]',
  },
  {
    id: 'settings-privacy',
    title: 'Privacy & Data',
    description: 'Control your data sharing and exports.',
    highlightSelector: '[data-tour="privacy-section"]',
  },
];
```

## Custom Styling

Override default styles in your CSS:

```css
/* Custom tour colors */
.tour-tooltip {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* Custom checklist styling */
.onboarding-checklist {
  border: 2px solid var(--color-primary);
  border-radius: 1rem;
}

/* Custom help widget */
.help-trigger {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

## Testing

### Unit Test Example

```tsx
import { render, screen } from '@testing-library/react';
import { OnboardingProvider } from '../utils/onboardingSystem';
import { OnboardingChecklist } from '../utils/onboardingSystem';

describe('OnboardingChecklist', () => {
  it('renders checklist items', () => {
    render(
      <OnboardingProvider>
        <OnboardingChecklist title="Test" />
      </OnboardingProvider>
    );

    expect(screen.getByText(/Test/i)).toBeInTheDocument();
  });
});
```

### Integration Test Example

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { OnboardingProvider, OnboardingChecklist } from '../utils/onboardingSystem';

describe('Onboarding Flow', () => {
  it('tracks checkpoint completion', () => {
    const { container } = render(
      <OnboardingProvider>
        <OnboardingChecklist />
      </OnboardingProvider>
    );

    const checkbox = container.querySelector('input[type="checkbox"]');
    fireEvent.click(checkbox);

    expect(checkbox).toBeChecked();
  });
});
```

## FAQ

**Q: How do I customize checkpoint text?**  
A: Edit `DEFAULT_CHECKPOINTS` in [onboardingSystem.tsx](web/src/utils/onboardingSystem.tsx)

**Q: How do I track custom tours?**  
A: Use `markTutorialWatched('custom-tour-id')` hook

**Q: Can I show hints based on user role?**  
A: Yes, use `useOnboarding()` to get user role and conditionally render hints

**Q: How do I persist custom data?**  
A: The system persists checkpoints automatically via LocalStorage

**Q: How do I test on mobile?**  
A: Use Chrome DevTools mobile emulation and verify:
  - Help widget repositions to bottom
  - Tour tooltips resize to 90vw
  - Touch targets are 44x44px minimum

## Performance Tips

1. **Lazy load tours** - Only create tour steps when page loads
2. **Memoize components** - Wrap tour steps in React.memo
3. **Debounce highlight resizing** - Use debounce for element repositioning
4. **Clear old hints** - Implement hint visibility tracking
5. **Monitor bundle size** - Keep components lightweight

## Common Issues

**Issue:** Tour highlight not appearing
- Check highlightSelector is correct
- Verify element exists before tour starts
- Check z-index conflicts

**Issue:** Checklist not persisting
- Verify LocalStorage is enabled
- Check browser console for errors
- Clear LocalStorage and restart

**Issue:** Help widget off-screen on mobile
- Check viewport meta tags
- Verify CSS media queries
- Test with actual mobile device

---

**Next Steps:** Run `npm run build`, test all tours and components, then commit!
