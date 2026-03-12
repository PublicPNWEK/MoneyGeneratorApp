# Onboarding & Educational System Documentation

## Overview

The Onboarding & Educational System provides a complete solution for user guidance, education, and progress tracking. It includes guided tours with visual highlighting, contextual tooltips, interactive checklists, help widgets with FAQs, and educational hints.

**Key Features:**
- ✅ Guided Tours with step-by-step walkthroughs
- ✅ Contextual Tooltips for feature hints
- ✅ Interactive Checklists with progress tracking
- ✅ Help Widget with FAQ/support panel
- ✅ Educational Hints with dismissible notifications
- ✅ Role-based Checkpoint System (freelancer, business, individual)
- ✅ LocalStorage persistence for progress
- ✅ Full dark mode support
- ✅ Responsive design for mobile

## Components

### 1. OnboardingProvider & Context

Manages global onboarding state and progress tracking.

**Location:** `web/src/utils/onboardingSystem.tsx`

**Usage:**

```tsx
import { OnboardingProvider } from './utils/onboardingSystem';

function App() {
  return (
    <OnboardingProvider>
      <YourApp />
    </OnboardingProvider>
  );
}
```

**Features:**
- Tracks user role (freelancer, business, individual)
- Maintains checkpoint completion status
- Stores tutorial watch history
- Persists data to LocalStorage
- Provides `useOnboarding()` hook for components

### 2. GuidedTour Component

Step-by-step walkthroughs with visual highlighting and smooth navigation.

**Props:**

```tsx
interface GuidedTourProps {
  steps: TourStep[];
  isActive: boolean;
  currentStepIndex: number;
  onStepChange?: (index: number) => void;
  onComplete?: () => void;
  onSkip?: () => void;
}

interface TourStep {
  id: string;
  title: string;
  description: string;
  highlightSelector?: string;  // CSS selector for element to highlight
  actions?: { label: string; action: () => void }[];
  position?: 'top' | 'bottom' | 'left' | 'right';
}
```

**Example:**

```tsx
import { GuidedTour, useTourNavigation } from './utils/onboardingSystem';

function FeatureTour() {
  const steps = [
    {
      id: 'welcome',
      title: 'Welcome to Dashboard',
      description: 'This is where all your insights live.',
      highlightSelector: '.dashboard-widget',
    },
    {
      id: 'metrics',
      title: 'Track Your Metrics',
      description: 'View income, expenses, and savings trends.',
      highlightSelector: '.metrics-panel',
    },
  ];

  const tour = useTourNavigation(steps, () => {
    console.log('Tour complete!');
  });

  return (
    <>
      <button onClick={tour.startTour}>Start Tour</button>
      {tour.isActive && (
        <GuidedTour
          steps={steps}
          isActive={tour.isActive}
          currentStepIndex={tour.currentStepIndex}
          onStepChange={tour.goToStep}
          onComplete={tour.skipTour}
          onSkip={tour.skipTour}
        />
      )}
    </>
  );
}
```

**Styling:**
- `.tour-highlight` - Element highlight with pulsing border
- `.tour-backdrop` - Semi-transparent backdrop
- `.tour-tooltip` - Tooltip container
- `.tour-progress-bar` - Progress visualization

### 3. Tooltip Component

Contextual help for UI elements.

**Props:**

```tsx
interface TooltipProps {
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  children: React.ReactNode;
  maxWidth?: number;
}
```

**Example:**

```tsx
import { Tooltip } from './utils/onboardingSystem';

function MyComponent() {
  return (
    <Tooltip content="Click to save your changes" position="right">
      <button>Save</button>
    </Tooltip>
  );
}
```

**Styling:**
- `.tooltip` - Tooltip container
- `.tooltip-top/bottom/left/right` - Position variants
- Automatic arrow positioning

### 4. OnboardingChecklist Component

Interactive checklist with progress percentage and importance indicators.

**Props:**

```tsx
interface ChecklistProps {
  title?: string;
  showProgress?: boolean;
}
```

**Example:**

```tsx
import { OnboardingChecklist } from './utils/onboardingSystem';

function SetupFlow() {
  return <OnboardingChecklist title="Complete Your Setup" showProgress />;
}
```

**Features:**
- Shows all checkpoints for user's role
- Checks off completed items
- Shows importance indicators (critical/important/optional)
- Displays completion percentage
- Celebration message when complete
- LocalStorage persistence

**Styling:**
- `.onboarding-checklist` - Main container
- `.checklist-item` - Individual item
- `.checklist-progress` - Progress bar
- `.checklist-complete` - Completion message

### 5. HelpWidget Component

Fixed-position help panel with expandable FAQ.

**Props:**

```tsx
interface HelpWidgetProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  items?: Array<{ q: string; a: string }>;
}
```

**Example:**

```tsx
import { HelpWidget } from './utils/onboardingSystem';

function Layout() {
  const faqItems = [
    { 
      q: 'How do I connect my bank?',
      a: 'Go to Settings > Bank Account and follow the secure connection process.' 
    },
    { 
      q: 'Is my data secure?',
      a: 'Yes, we use bank-level encryption and never store sensitive account details.' 
    },
  ];

  return (
    <>
      <YourPageContent />
      <HelpWidget position="bottom-right" items={faqItems} />
    </>
  );
}
```

**Features:**
- Fixed positioning on screen
- Expandable/collapsible FAQ items
- Smooth animations
- Mobile responsive
- Toggle button with animated icon

**Styling:**
- `.help-widget` - Container
- `.help-trigger` - Toggle button
- `.help-panel` - Panel container
- `.help-item` - FAQ item
- `.help-question` - Question (clickable)
- `.help-answer` - Answer (expandable)

### 6. EducationalHint Component

Dismissible notification hints for feature education.

**Props:**

```tsx
interface HintProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  onDismiss?: () => void;
  type?: 'info' | 'success' | 'warning' | 'tip';
}
```

**Example:**

```tsx
import { EducationalHint } from './utils/onboardingSystem';
import { Lightbulb } from 'lucide-react';

function Dashboard() {
  return (
    <>
      <EducationalHint
        type="tip"
        title="Pro Tip"
        description="You can drag and drop components to organize your dashboard."
        icon={<Lightbulb />}
        onDismiss={() => console.log('Dismissed')}
      />
      <DashboardContent />
    </>
  );
}
```

**Types:**
- `info` - General information (blue)
- `success` - Positive feedback (green)
- `warning` - Important notice (orange)
- `tip` - Helpful suggestion (purple)

**Styling:**
- `.educational-hint` - Container
- `.hint-info/success/warning/tip` - Type variants
- `.hint-icon` - Icon area
- `.hint-title` - Title text
- `.hint-description` - Description text

## Hooks

### useOnboarding()

Access and manage global onboarding state.

**Returns:**

```tsx
{
  user: OnboardingUser;
  updateCheckpoint: (id: string, completed: boolean) => void;
  markTutorialWatched: (tutorialId: string) => void;
  getCompletionPercentage: () => number;
  getAllCheckpoints: () => OnboardingCheckpoint[];
}
```

**Example:**

```tsx
import { useOnboarding } from './utils/onboardingSystem';

function MyComponent() {
  const { updateCheckpoint, getCompletionPercentage } = useOnboarding();

  return (
    <>
      <p>Your progress: {getCompletionPercentage()}%</p>
      <button onClick={() => updateCheckpoint('setup_profile', true)}>
        Mark Profile Setup Complete
      </button>
    </>
  );
}
```

### useTourNavigation(steps, onComplete?)

Simplifies managing tour state and navigation.

**Returns:**

```tsx
{
  currentStep: TourStep;
  currentStepIndex: number;
  isActive: boolean;
  progress: number;
  goToStep: (index: number) => void;
  nextStep: () => void;
  previousStep: () => void;
  skipTour: () => void;
  startTour: () => void;
  hasNextStep: boolean;
  hasPreviousStep: boolean;
}
```

**Example:**

```tsx
const tour = useTourNavigation(steps, () => {
  console.log('Tour finished!');
  markTutorialWatched('dashboard-tour');
});

return (
  <>
    <button onClick={tour.startTour}>Start Tour</button>
    <button onClick={tour.nextStep} disabled={!tour.hasNextStep}>
      Next ({tour.progress.toFixed(0)}%)
    </button>
  </>
);
```

### useCheckpointProgress(role?)

Track checkpoint completion with automatic updates.

**Returns:**

```tsx
{
  percentComplete: number;
  completedCount: number;
  totalCount: number;
  checkpoints: OnboardingCheckpoint[];
  completeCheckpoint: (id: string) => void;
  isComplete: boolean;
}
```

**Example:**

```tsx
const progress = useCheckpointProgress('freelancer');

return (
  <div>
    <p>{progress.percentComplete.toFixed(0)}% complete</p>
    <p>{progress.completedCount} of {progress.totalCount} tasks</p>
    {progress.isComplete && <p>🎉 All set up!</p>}
  </div>
);
```

### useHelpWidget()

Manage help widget visibility.

**Returns:**

```tsx
{
  isOpen: boolean;
  toggleHelp: () => void;
  closeHelp: () => void;
  openHelp: () => void;
}
```

**Example:**

```tsx
const { isOpen, toggleHelp, closeHelp } = useHelpWidget();

return (
  <HelpWidget
    position="bottom-right"
    isOpen={isOpen}
    onToggle={toggleHelp}
    onClose={closeHelp}
  />
);
```

## Role-Based Checkpoints

### Freelancer Role

```
1. Welcome & Quick Setup (critical)
2. Connect Bank Account (critical)
3. Set Income Categories (important)
4. Explore Dashboard & Insights (important)
5. Save Income Goals (optional)
6. Learn About Mobile App (optional)
```

### Business Role

```
1. Welcome & Company Setup (critical)
2. Connect Business Bank Account (critical)
3. Connect Accounting Software (important)
4. Add Team Members (important)
5. Setup Automated Bookkeeping (important)
6. Configure Payroll Settings (important)
```

### Individual Role

```
1. Welcome & Setup (critical)
2. Connect Bank Account (important)
3. Add Income & Expense Categories (important)
4. Set Savings Goals (optional)
5. Explore Financial Insights (optional)
```

## Styling & Theming

All components support dark mode automatically. They use CSS variables for colors:

```css
/* Light mode (default) */
--color-primary: #2563eb
--color-neutral-100: #f3f4f6
--color-dark-text: #111827

/* Dark mode (body.dark class) */
background: var(--color-dark-surface, #1f2937)
color: var(--color-dark-text, #f3f4f6)
```

**CSS Classes for Customization:**

- `.guided-tour-trigger` - Tour start button
- `.tour-highlight` - Element highlight
- `.tour-tooltip` - Tour message box
- `.tooltip` - Tooltip element
- `.onboarding-checklist` - Checklist container
- `.help-widget` - Help widget
- `.educational-hint` - Hint container

## Integration Examples

### Example 1: Dashboard Tour

```tsx
import { GuidedTour, useTourNavigation, useOnboarding } from './utils/onboardingSystem';

export function DashboardPage() {
  const { markTutorialWatched } = useOnboarding();
  
  const tourSteps = [
    {
      id: 'welcome-dashboard',
      title: 'Welcome to Your Dashboard',
      description: 'Here you can see all your financial metrics at a glance.',
      highlightSelector: '.dashboard-header',
    },
    {
      id: 'widgets',
      title: 'Customizable Widgets',
      description: 'Click and drag widgets to rearrange your view.',
      highlightSelector: '.widgets-grid',
    },
    {
      id: 'filters',
      title: 'Filter Your Data',
      description: 'Use these filters to focus on specific time periods.',
      highlightSelector: '.filter-bar',
    },
  ];

  const tour = useTourNavigation(tourSteps, () => {
    markTutorialWatched('dashboard-tour');
  });

  return (
    <>
      {tour.isActive && (
        <GuidedTour
          steps={tourSteps}
          isActive
          currentStepIndex={tour.currentStepIndex}
          onStepChange={tour.goToStep}
          onComplete={tour.skipTour}
          onSkip={tour.skipTour}
        />
      )}
      
      <DashboardContent />
      
      <button onClick={tour.startTour}>
        🎯 Start Dashboard Tour
      </button>
    </>
  );
}
```

### Example 2: Onboarding Flow with Checklist

```tsx
import { OnboardingChecklist, useCheckpointProgress } from './utils/onboardingSystem';

export function OnboardingFlow() {
  const progress = useCheckpointProgress('freelancer');

  return (
    <div className="onboarding-container">
      <h1>Complete Setup</h1>
      
      <OnboardingChecklist 
        title="Freelancer Onboarding"
        showProgress
      />
      
      {progress.isComplete ? (
        <div className="success-message">
          <h2>🎉 You're All Set!</h2>
          <p>Start earning and managing your finances.</p>
          <button onClick={() => navigate('/dashboard')}>
            Go to Dashboard
          </button>
        </div>
      ) : (
        <p>Complete {progress.totalCount - progress.completedCount} more tasks</p>
      )}
    </div>
  );
}
```

### Example 3: Feature Help with Tooltip & Hint

```tsx
import { Tooltip, EducationalHint } from './utils/onboardingSystem';
import { AlertCircle, HelpCircle } from 'lucide-react';

export function BankConnectionFlow() {
  const [showHint, setShowHint] = useState(true);

  return (
    <div>
      {showHint && (
        <EducationalHint
          type="info"
          title="Secure Connection"
          description="We use Plaid's secure connection. Your login info is never stored."
          icon={<AlertCircle />}
          onDismiss={() => setShowHint(false)}
        />
      )}

      <div className="connection-form">
        <Tooltip 
          content="Your bank supports instant verification" 
          position="right"
        >
          <label>
            <HelpCircle size={16} />
            Bank Name
          </label>
        </Tooltip>
        
        <input type="text" placeholder="Search your bank..." />
      </div>
    </div>
  );
}
```

## LocalStorage Persistence

All checkpoint progress is automatically saved to LocalStorage:

```javascript
// The system uses 'onboarding-state' key
localStorage.getItem('onboarding-state')

// Format:
{
  user: {
    role: 'freelancer',
    checkpoints: [
      { id: 'welcome', label: 'Welcome & Setup', completed: true, ... },
      { id: 'connect_bank', label: 'Connect Bank', completed: false, ... }
    ],
    tutorialsWatched: ['dashboard-tour', 'settings-guide']
  }
}
```

## Accessibility

All components include ARIA labels and semantic HTML:

- Buttons have `aria-label` attributes
- Notifications use `role="notification"`
- Forms use proper label associations
- Keyboard navigation supported
- Screen reader friendly

## Mobile Responsiveness

Components automatically adapt to mobile screens:

- Tour tooltips resize to 90vw on mobile
- Help widget repositions for thumb reach
- Touch-friendly touch targets (44x44px minimum)
- Optimized spacing for small screens

## Performance

- Components use React.memo for optimization
- CSS animations use transform/opacity (GPU-accelerated)
- LocalStorage checks happen on component mount only
- Tour highlighting uses CSS for smooth animations

## License

Part of Money Generator App. All rights reserved.
