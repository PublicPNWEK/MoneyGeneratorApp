import type { ReportsChartEarningsPoint, SelectedMetric } from './ReportsChartPreviewTypes';
import { SVG_CHART_HEIGHT, SVG_CHART_PADDING, SVG_CHART_WIDTH, createAreaPath, createLinePath, formatShortDate } from './ReportsChartSvgUtils';

interface ReportsChartAreaPreviewProps {
  earningsData: ReportsChartEarningsPoint[];
  selectedMetrics: SelectedMetric[];
  isStacked: boolean;
}

export default function ReportsChartAreaPreview({ earningsData, selectedMetrics, isStacked }: ReportsChartAreaPreviewProps) {
  const series = isStacked
    ? selectedMetrics.map((metric, metricIndex) => earningsData.map((point) => {
        const own = Number(point[metric.field as keyof ReportsChartEarningsPoint]) || 0;
        const previous = selectedMetrics.slice(0, metricIndex).reduce((sum, priorMetric) => sum + (Number(point[priorMetric.field as keyof ReportsChartEarningsPoint]) || 0), 0);
        return own + previous;
      }))
    : selectedMetrics.map((metric) => earningsData.map((point) => Number(point[metric.field as keyof ReportsChartEarningsPoint]) || 0));

  return (
    <div className="builder-svg-chart-shell">
      <svg className="builder-svg-chart" viewBox={`0 0 ${SVG_CHART_WIDTH} ${SVG_CHART_HEIGHT}`} role="img" aria-label="Area chart preview">
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
        {series.map((values, index) => (
          <g key={selectedMetrics[index].field}>
            <path d={createAreaPath(values)} fill={selectedMetrics[index].color} fillOpacity="0.18" />
            <path d={createLinePath(values)} fill="none" stroke={selectedMetrics[index].color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        ))}
      </svg>
      <div className="builder-svg-axis-labels">
        <span>{formatShortDate(earningsData[0]?.date ?? '')}</span>
        <span>{formatShortDate(earningsData[Math.floor(Math.max(earningsData.length - 1, 0) / 2)]?.date ?? '')}</span>
        <span>{formatShortDate(earningsData[earningsData.length - 1]?.date ?? '')}</span>
      </div>
    </div>
  );
}
