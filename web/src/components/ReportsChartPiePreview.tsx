import type { ReportsChartEarningsPoint, SelectedMetric } from './ReportsChartPreviewTypes';
import { SVG_CHART_HEIGHT, SVG_CHART_WIDTH, describeArc, formatCurrency } from './ReportsChartSvgUtils';

interface ReportsChartPiePreviewProps {
  earningsData: ReportsChartEarningsPoint[];
  selectedMetrics: SelectedMetric[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const colorClassNames: Record<string, string> = {
  '#3b82f6': 'platform-breakdown-fill-blue',
  '#10b981': 'platform-breakdown-fill-emerald',
  '#f59e0b': 'platform-breakdown-fill-amber',
  '#ef4444': 'platform-breakdown-fill-red',
  '#8b5cf6': 'platform-breakdown-fill-violet',
  '#06b6d4': 'platform-breakdown-fill-cyan',
};

export default function ReportsChartPiePreview({ earningsData, selectedMetrics }: ReportsChartPiePreviewProps) {
  let data: Array<{ name: string; value: number; color?: string }>;

  if (selectedMetrics.length === 1) {
    const field = selectedMetrics[0].field as keyof ReportsChartEarningsPoint;
    data = earningsData.map((point) => ({
      name: point.date,
      value: Number(point[field]) || 0,
    }));
  } else {
    data = selectedMetrics.map((metric) => ({
      name: metric.label,
      value: earningsData.reduce((sum, point) => sum + (Number(point[metric.field as keyof ReportsChartEarningsPoint]) || 0), 0),
      color: metric.color,
    }));
  }

  const total = Math.max(data.reduce((sum, item) => sum + item.value, 0), 1);
  const centerX = SVG_CHART_WIDTH / 2;
  const centerY = SVG_CHART_HEIGHT / 2;
  const radius = 92;
  let currentAngle = 0;

  return (
    <div className="builder-svg-pie-layout">
      <svg className="builder-svg-chart builder-svg-chart--pie" viewBox={`0 0 ${SVG_CHART_WIDTH} ${SVG_CHART_HEIGHT}`} role="img" aria-label="Pie chart preview">
        {data.map((item, index) => {
          const angle = (item.value / total) * 360;
          const path = describeArc(centerX, centerY, radius, currentAngle, currentAngle + angle);
          const fill = item.color || COLORS[index % COLORS.length];
          currentAngle += angle;

          return <path key={`${item.name}-${index}`} d={path} fill={fill} stroke="rgba(15, 23, 42, 0.75)" strokeWidth="2" />;
        })}
        <circle cx={centerX} cy={centerY} r="42" fill="var(--bg-secondary)" />
        <text x={centerX} y={centerY - 4} textAnchor="middle" className="builder-svg-pie-total-label">Total</text>
        <text x={centerX} y={centerY + 18} textAnchor="middle" className="builder-svg-pie-total-value">{formatCurrency(total)}</text>
      </svg>
      <div className="builder-svg-pie-legend">
        {data.map((item, index) => {
          const fill = item.color || COLORS[index % COLORS.length];
          return (
            <div key={`${item.name}-${index}`} className="builder-svg-pie-legend-item">
              <span className={`builder-svg-pie-legend-dot ${colorClassNames[fill] || 'platform-breakdown-fill-blue'}`} />
              <span className="builder-svg-pie-legend-name">{item.name}</span>
              <strong>{((item.value / total) * 100).toFixed(0)}%</strong>
            </div>
          );
        })}
      </div>
    </div>
  );
}
