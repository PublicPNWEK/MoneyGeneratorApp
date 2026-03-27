export interface ReportsChartEarningsPoint {
  date: string;
  earnings: number;
  expenses: number;
  net: number;
}

export interface SelectedMetric {
  field: string;
  color: string;
  label: string;
}
