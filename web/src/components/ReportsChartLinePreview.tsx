import type { ReportsChartEarningsPoint, SelectedMetric } from './ReportsChartPreviewTypes';
import { SVG_CHART_HEIGHT, SVG_CHART_PADDING, SVG_CHART_WIDTH, createLinePath, formatCurrency, formatShortDate, getChartBounds } from './ReportsChartSvgUtils';

interface ReportsChartLinePreviewProps {
  earningsData: ReportsChartEarningsPoint[];
  selectedMetrics: SelectedMetric[];
}

export default function ReportsChartLinePreview({ earningsData, selectedMetrics }: ReportsChartLinePreviewProps) {
  const values = selectedMetrics.flatMap((metric) => earningsData.map((point) => Number(point[metric.field as keyof ReportsChartEarningsPoint]) || 0));
  const bounds = getChartBounds(values);

  return (
    <div className="builder-svg-chart-shell">
      <svg className="builder-svg-chart" viewBox={`0 0 ${SVG_CHART_WIDTH} ${SVG_CHART_HEIGHT}`} role="img" aria-label="Line chart preview">
        {[0.2, 0.4, 0.6, 0.8].map((ratio) => (
          <line
            key={ratio}
            className="builder-svg-grid-line"
            x1={SVG_CHART_PADDING}
            x2={SVG_CHART_WIDTH - SVG_CHART_PADDING}
            y1={SVG_CHART_PADDING + (SVG_CHART_HEIGHT - SVG_CHART_PADDING * 2) * ratio}
            y2={SVG_CHART_PADDING + (SVG_CHART_HEIGHT - SVG_CHART_PADDING * 2) * ratio}
          />
        ))}
        {selectedMetrics.map((metric) => {
          const metricValues = earningsData.map((point) => Number(point[metric.field as keyof ReportsChartEarningsPoint]) || 0);
          return (
            <path key={metric.field} d={createLinePath(metricValues)} fill="none" stroke={metric.color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          );
        })}
      </svg>
      <div className="builder-svg-axis-labels">
        <span>{formatShortDate(earningsData[0]?.date ?? '')}</span>
        <span>{formatShortDate(earningsData[Math.floor(Math.max(earningsData.length - 1, 0) / 2)]?.date ?? '')}</span>
        <span>{formatShortDate(earningsData[earningsData.length - 1]?.date ?? '')}</span>
      </div>
      <div className="builder-svg-summary">
        <span>{formatCurrency(bounds.maxValue)}</span>
        <span>{formatCurrency(bounds.minValue)}</span>
      </div>
    </div>
  );
}
