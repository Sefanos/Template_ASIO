export interface PeakDay {
  date: string;
  day: string;
  logins: number;
}

export interface ActivitySummary {
  total_logins: number;
  average_sessions: number;
  peak_day: PeakDay;
}

export interface DailyActivityData {
  date: string;
  logins: number;
  active_sessions: number;
  logouts: number;
}

export interface UserActivity {
  summary: ActivitySummary;
  daily_data: DailyActivityData[];
  timeframe: string;
}

export interface UserActivityResponse {
  success: boolean;
  data: UserActivity;
  message?: string;
  errors?: {[key: string]: string[]};
}

export interface ActiveSessionsData {
  active_users: number;
  measured_at: string;
  auth_method: string;
  sources?: {
    tokens: number;
    last_login: number;
    activity_logs: number;
  };
}

export interface ActiveSessionsResponse {
  success: boolean;
  data: ActiveSessionsData;
  message?: string;
  errors?: {[key: string]: string[]};
}

export interface ChartDataset {
  label: string;
  data: number[];
  borderColor: string;
  backgroundColor: string;
  fill: boolean;
  pointRadius?: number;
  pointHoverRadius?: number;
}

export interface ActivityChartData {
  labels: string[];
  datasets: ChartDataset[];
}