import { Suspense, lazy, useMemo, useState } from 'react';
import { Check, Save, Trash2 } from 'lucide-react';
import type { ReportsChartEarningsPoint, SelectedMetric } from './ReportsChartPreviewTypes';

interface SavedChartConfig {
  id: string;
  name: string;
  chartType: string;
  metrics: SelectedMetric[];
  stacked: boolean;
  createdAt: string;
}

interface ReportsChartBuilderProps {
  earningsData: ReportsChartEarningsPoint[];
}

const colorClassNames: Record<string, string> = {
  '#3b82f6': 'color-swatch-blue',
  '#ef4444': 'color-swatch-red',
  '#10b981': 'color-swatch-emerald',
  '#f59e0b': 'color-swatch-amber',
  '#8b5cf6': 'color-swatch-violet',
  '#06b6d4': 'color-swatch-cyan',
  '#ec4899': 'color-swatch-pink',
  '#84cc16': 'color-swatch-lime',
};

const ReportsChartLinePreview = lazy(() => import('./ReportsChartLinePreview'));
const ReportsChartBarPreview = lazy(() => import('./ReportsChartBarPreview'));
const ReportsChartAreaPreview = lazy(() => import('./ReportsChartAreaPreview'));
const ReportsChartPiePreview = lazy(() => import('./ReportsChartPiePreview'));

const chartTypes = [
  { label: 'Line', value: 'line' },
  { label: 'Bar', value: 'bar' },
  { label: 'Area', value: 'area' },
  { label: 'Pie', value: 'pie' },
];

const chartFields = [
  { label: 'Earnings', value: 'earnings', color: '#3b82f6' },
  { label: 'Expenses', value: 'expenses', color: '#ef4444' },
  { label: 'Net Profit', value: 'net', color: '#10b981' },
];

const colorOptions = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];

export default function ReportsChartBuilder({ earningsData }: ReportsChartBuilderProps) {
  const [customChartType, setCustomChartType] = useState('line');
  const [selectedMetrics, setSelectedMetrics] = useState<SelectedMetric[]>([
    { field: 'earnings', color: '#3b82f6', label: 'Earnings' },
  ]);
  const [isStacked, setIsStacked] = useState(false);
  const [savedCharts, setSavedCharts] = useState<SavedChartConfig[]>(() => {
    try {
      const saved = localStorage.getItem('savedChartConfigs');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [chartName, setChartName] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);

  const toggleMetric = (field: string) => {
    const existing = selectedMetrics.find((metric) => metric.field === field);
    if (existing) {
      if (selectedMetrics.length > 1) {
        setSelectedMetrics(selectedMetrics.filter((metric) => metric.field !== field));
      }
      return;
    }

    const fieldDef = chartFields.find((metric) => metric.value === field);
    if (fieldDef) {
      setSelectedMetrics([...selectedMetrics, { field, color: fieldDef.color, label: fieldDef.label }]);
    }
  };

  const updateMetricColor = (field: string, color: string) => {
    setSelectedMetrics(selectedMetrics.map((metric) => (
      metric.field === field ? { ...metric, color } : metric
    )));
  };

  const saveChartConfig = () => {
    if (!chartName.trim()) return;
    const config: SavedChartConfig = {
      id: `chart_${Date.now()}`,
      name: chartName.trim(),
      chartType: customChartType,
      metrics: selectedMetrics,
      stacked: isStacked,
      createdAt: new Date().toISOString(),
    };
    const updated = [...savedCharts, config];
    setSavedCharts(updated);
    localStorage.setItem('savedChartConfigs', JSON.stringify(updated));
    setChartName('');
    setShowSaveForm(false);
  };

  const loadChartConfig = (config: SavedChartConfig) => {
    setCustomChartType(config.chartType);
    setSelectedMetrics(config.metrics);
    setIsStacked(config.stacked);
  };

  const deleteChartConfig = (id: string) => {
    const updated = savedCharts.filter((config) => config.id !== id);
    setSavedCharts(updated);
    localStorage.setItem('savedChartConfigs', JSON.stringify(updated));
  };

  const preview = useMemo(() => {
    if (customChartType === 'bar') {
      return <ReportsChartBarPreview earningsData={earningsData} selectedMetrics={selectedMetrics} isStacked={isStacked} />;
    }

    if (customChartType === 'area') {
      return <ReportsChartAreaPreview earningsData={earningsData} selectedMetrics={selectedMetrics} isStacked={isStacked} />;
    }

    if (customChartType === 'pie') {
      return <ReportsChartPiePreview earningsData={earningsData} selectedMetrics={selectedMetrics} />;
    }

    return <ReportsChartLinePreview earningsData={earningsData} selectedMetrics={selectedMetrics} />;
  }, [customChartType, earningsData, isStacked, selectedMetrics]);

  return (
    <div className="custom-chart-section">
      <div className="custom-chart-header">
        <h3>Custom Chart Builder</h3>
        <div className="chart-header-actions">
          {savedCharts.length > 0 && (
            <div className="saved-charts-dropdown">
              <button className="action-btn" aria-label="Load saved chart" type="button">
                Load Saved
              </button>
              <div className="dropdown-menu">
                {savedCharts.map((config) => (
                  <div key={config.id} className="saved-chart-item">
                    <button onClick={() => loadChartConfig(config)} aria-label={`Load ${config.name}`} type="button">
                      {config.name}
                    </button>
                    <button
                      className="delete-btn"
                      onClick={(event) => {
                        event.stopPropagation();
                        deleteChartConfig(config.id);
                      }}
                      aria-label={`Delete ${config.name}`}
                      title="Delete chart"
                      type="button"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {showSaveForm ? (
            <div className="save-chart-form">
              <input
                type="text"
                placeholder="Chart name..."
                value={chartName}
                onChange={(event) => setChartName(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && saveChartConfig()}
              />
              <button className="action-btn primary" onClick={saveChartConfig} type="button">
                <Check size={14} />
                Save
              </button>
              <button className="action-btn" onClick={() => setShowSaveForm(false)} type="button">
                Cancel
              </button>
            </div>
          ) : (
            <button className="action-btn" onClick={() => setShowSaveForm(true)} type="button">
              <Save size={14} />
              Save Chart
            </button>
          )}
        </div>
      </div>

      <div className="custom-chart-controls">
        <div className="control-group">
          <label htmlFor="chart-type-select">Chart Type:</label>
          <select id="chart-type-select" value={customChartType} onChange={(event) => setCustomChartType(event.target.value)} aria-label="Select chart type">
            {chartTypes.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </div>

        <div className="control-group">
          <label>Metrics:</label>
          <div className="metric-toggles" role="group" aria-label="Select metrics to display">
            {chartFields.map((field) => {
              const isSelected = selectedMetrics.some((metric) => metric.field === field.value);
              const metric = selectedMetrics.find((candidate) => candidate.field === field.value);
              return (
                <div key={field.value} className={`metric-toggle ${isSelected ? 'active' : ''}`}>
                  <button onClick={() => toggleMetric(field.value)} aria-label={`Toggle ${field.label} metric`} type="button">
                    <span className={`color-dot ${colorClassNames[metric?.color || field.color] || 'color-swatch-blue'}`} />
                    {field.label}
                  </button>
                  {isSelected && (
                    <div className="color-picker-mini" role="group" aria-label={`Color options for ${field.label}`}>
                      {colorOptions.map((color) => (
                        <button
                          key={color}
                          className={`color-option ${colorClassNames[color] || 'color-swatch-blue'} ${metric?.color === color ? 'selected' : ''}`}
                          onClick={() => updateMetricColor(field.value, color)}
                          aria-label={`Set ${field.label} color to ${color}`}
                          title={color}
                          type="button"
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {(customChartType === 'bar' || customChartType === 'area') && selectedMetrics.length > 1 && (
          <div className="control-group">
            <label className="checkbox-label">
              <input type="checkbox" checked={isStacked} onChange={(event) => setIsStacked(event.target.checked)} />
              Stacked
            </label>
          </div>
        )}
      </div>

      <div className="custom-chart-preview">
        <Suspense
          fallback={
            <div className="reports-builder-skeleton">
              <div className="reports-builder-skeleton__surface" />
            </div>
          }
        >
          {preview}
        </Suspense>
      </div>
    </div>
  );
}