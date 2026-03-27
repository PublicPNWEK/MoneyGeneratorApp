import type { ReportsChartEarningsPoint, SelectedMetric } from './ReportsChartPreviewTypes';
import { SVG_CHART_HEIGHT, SVG_CHART_PADDING, SVG_CHART_WIDTH, formatShortDate, getChartBounds, getXPosition, getYPosition } from './ReportsChartSvgUtils';

interface ReportsChartBarPreviewProps {
  earningsData: ReportsChartEarningsPoint[];
  selectedMetrics: SelectedMetric[];
  isStacked: boolean;
}

export default function ReportsChartBarPreview({ earningsData, selectedMetrics, isStacked }: ReportsChartBarPreviewProps) {
  const values = isStacked
    ? earningsData.map((point) => selectedMetrics.reduce((sum, metric) => sum + (Number(point[metric.field as keyof ReportsChartEarningsPoint]) || 0), 0))
    : selectedMetrics.flatMap((metric) => earningsData.map((point) => Number(point[metric.field as keyof ReportsChartEarningsPoint]) || 0));
  const bounds = getChartBounds(values);
  const usableWidth = SVG_CHART_WIDTH - SVG_CHART_PADDING * 2;
  const bandWidth = usableWidth / Math.max(earningsData.length, 1);
  const innerGap = Math.max(4, bandWidth * 0.08);

  return (
    <div className="builder-svg-chart-shell">
      <svg className="builder-svg-chart" viewBox={`0 0 ${SVG_CHART_WIDTH} ${SVG_CHART_HEIGHT}`} role="img" aria-label="Bar chart preview">
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
        {earningsData.map((point, pointIndex) => {
          const centerX = getXPosition(pointIndex, earningsData.length);
          const slotWidth = Math.max(10, bandWidth - innerGap * 2);

          if (isStacked) {
            let currentY = SVG_CHART_HEIGHT - SVG_CHART_PADDING;
            return selectedMetrics.map((metric) => {
              const value = Number(point[metric.field as keyof ReportsChartEarningsPoint]) || 0;
              const targetY = getYPosition(value, bounds);
              const height = Math.max(0, SVG_CHART_HEIGHT - SVG_CHART_PADDING - targetY);
              currentY -= height;

              return (
                <rect
                  key={`${point.date}-${metric.field}`}
                  x={centerX - slotWidth / 2}
                  y={currentY}
                  width={slotWidth}
                  height={height}
                  rx="6"
                  fill={metric.color}
                />
              );
            });
          }

          const singleBarWidth = slotWidth / Math.max(selectedMetrics.length, 1);
          return selectedMetrics.map((metric, metricIndex) => {
            const value = Number(point[metric.field as keyof ReportsChartEarningsPoint]) || 0;
            const y = getYPosition(value, bounds);
            const height = Math.max(0, SVG_CHART_HEIGHT - SVG_CHART_PADDING - y);
            return (
              <rect
                key={`${point.date}-${metric.field}`}
                x={centerX - slotWidth / 2 + metricIndex * singleBarWidth}
                y={y}
                width={Math.max(8, singleBarWidth - 2)}
                height={height}
                rx="6"
                fill={metric.color}
              />
            );
          });
        })}
      </svg>
      <div className="builder-svg-axis-labels builder-svg-axis-labels--dense">
        {earningsData.slice(-5).map((point) => (
          <span key={point.date}>{formatShortDate(point.date)}</span>
        ))}
      </div>
    </div>
  );
}
