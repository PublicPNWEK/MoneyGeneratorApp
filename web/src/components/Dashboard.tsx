import './Dashboard.css';

interface ProgressStep {
  id: string;
  label: string;
  completed: boolean;
}

interface ProgressTrackerProps {
  steps: ProgressStep[];
  onStepClick?: (stepId: string) => void;
}

export function ProgressTracker({ steps, onStepClick }: ProgressTrackerProps) {
  const completedCount = steps.filter((s) => s.completed).length;
  const progress = (completedCount / steps.length) * 100;

  return (
    <div className="progress-tracker">
      <div className="progress-header">
        <span className="progress-title">Complete your profile</span>
        <span className="progress-count">
          {completedCount}/{steps.length} steps
        </span>
      </div>
      <div className="progress-bar-container">
        <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
      </div>
      <div className="progress-steps">
        {steps.map((step) => (
          <div
            key={step.id}
            className={`progress-step ${step.completed ? 'completed' : ''}`}
            onClick={() => !step.completed && onStepClick?.(step.id)}
          >
            <span className="step-indicator">
              {step.completed ? '✓' : '○'}
            </span>
            <span className="step-label">{step.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: string;
  label: string;
  value: string;
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
}

export function StatCard({ icon, label, value, trend }: StatCardProps) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div className="stat-content">
        <span className="stat-label">{label}</span>
        <span className="stat-value">{value}</span>
        {trend && (
          <span className={`stat-trend ${trend.direction}`}>
            {trend.direction === 'up' ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
        )}
      </div>
    </div>
  );
}

interface QuickActionProps {
  icon: string;
  label: string;
  description: string;
  onClick: () => void;
}

export function QuickAction({ icon, label, description, onClick }: QuickActionProps) {
  return (
    <button className="quick-action" onClick={onClick}>
      <span className="action-icon">{icon}</span>
      <div className="action-content">
        <span className="action-label">{label}</span>
        <span className="action-description">{description}</span>
      </div>
      <span className="action-arrow">→</span>
    </button>
  );
}

interface DashboardProps {
  earnings: number;
  weeklyChange: number;
  bankConnected: boolean;
  hasSubscription: boolean;
  onConnectBank: () => void;
  onUpgrade: () => void;
  onViewAnalytics: () => void;
}

export function Dashboard({
  earnings,
  weeklyChange,
  bankConnected,
  hasSubscription,
  onConnectBank,
  onUpgrade,
  onViewAnalytics,
}: DashboardProps) {
  const progressSteps = [
    { id: 'profile', label: 'Complete profile', completed: true },
    { id: 'bank', label: 'Connect bank', completed: bankConnected },
    { id: 'plan', label: 'Choose a plan', completed: hasSubscription },
  ];

  const allComplete = progressSteps.every((s) => s.completed);

  return (
    <div className="dashboard">
      {!allComplete && (
        <ProgressTracker
          steps={progressSteps}
          onStepClick={(stepId) => {
            if (stepId === 'bank') onConnectBank();
            if (stepId === 'plan') onUpgrade();
          }}
        />
      )}

      <div className="stats-grid">
        <StatCard
          icon="💰"
          label="This Month"
          value={`$${earnings.toLocaleString()}`}
          trend={{ value: weeklyChange, direction: weeklyChange >= 0 ? 'up' : 'down' }}
        />
        <StatCard icon="📊" label="Active Gigs" value="3" />
        <StatCard icon="🎯" label="Goal Progress" value="68%" />
      </div>

      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="actions-grid">
          {!bankConnected && (
            <QuickAction
              icon="🏦"
              label="Connect Bank"
              description="Track transactions automatically"
              onClick={onConnectBank}
            />
          )}
          {!hasSubscription && (
            <QuickAction
              icon="⚡"
              label="Upgrade to Pro"
              description="Unlock advanced analytics"
              onClick={onUpgrade}
            />
          )}
          <QuickAction
            icon="📈"
            label="View Analytics"
            description="See your earning trends"
            onClick={onViewAnalytics}
          />
        </div>
      </div>
    </div>
  );
}
