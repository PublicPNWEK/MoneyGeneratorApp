import type { ReportsChartEarningsPoint, SelectedMetric } from './ReportsChartPreviewTypes';

export const SVG_CHART_WIDTH = 720;
export const SVG_CHART_HEIGHT = 300;
export const SVG_CHART_PADDING = 28;

export function formatCurrency(value: number) {
  return `$${Math.round(value).toLocaleString()}`;
}

export function formatShortDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function getMetricValues(data: ReportsChartEarningsPoint[], metrics: SelectedMetric[]) {
  return metrics.flatMap((metric) => data.map((point) => Number(point[metric.field as keyof ReportsChartEarningsPoint]) || 0));
}

export function getChartBounds(values: number[]) {
  const maxValue = Math.max(...values, 1);
  const minValue = Math.min(...values, 0);
  const range = Math.max(maxValue - minValue, 1);

  return { maxValue, minValue, range };
}

export function getXPosition(index: number, total: number) {
  const usableWidth = SVG_CHART_WIDTH - SVG_CHART_PADDING * 2;
  return SVG_CHART_PADDING + (usableWidth * index) / Math.max(total - 1, 1);
}

export function getYPosition(value: number, bounds: ReturnType<typeof getChartBounds>) {
  const usableHeight = SVG_CHART_HEIGHT - SVG_CHART_PADDING * 2;
  return SVG_CHART_HEIGHT - SVG_CHART_PADDING - ((value - bounds.minValue) / bounds.range) * usableHeight;
}

export function createLinePath(values: number[]) {
  const bounds = getChartBounds(values);

  return values
    .map((value, index) => {
      const x = getXPosition(index, values.length);
      const y = getYPosition(value, bounds);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');
}

export function createAreaPath(values: number[]) {
  if (values.length === 0) {
    return '';
  }

  const linePath = createLinePath(values);
  const firstX = getXPosition(0, values.length);
  const lastX = getXPosition(values.length - 1, values.length);
  const baseline = SVG_CHART_HEIGHT - SVG_CHART_PADDING;

  return `${linePath} L ${lastX} ${baseline} L ${firstX} ${baseline} Z`;
}

export function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

export function describeArc(centerX: number, centerY: number, radius: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(centerX, centerY, radius, endAngle);
  const end = polarToCartesian(centerX, centerY, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

  return [
    `M ${centerX} ${centerY}`,
    `L ${start.x} ${start.y}`,
    `A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
    'Z',
  ].join(' ');
}
