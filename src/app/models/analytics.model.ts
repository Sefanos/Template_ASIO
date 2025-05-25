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

export interface UserStatusCounts {
  active: number;
  pending: number;
  inactive: number;
}

export interface UserStatsData {
  total_users: number;
  new_users: number;
  by_status: UserStatusCounts;
  timeframe: string;
}

export interface UserStatsResponse {
  success: boolean;
  data: UserStatsData;
  message?: string;
  errors?: {[key: string]: string[]};
}

export interface Role {
  id: number;
  name: string;
  code: string;
  users_count: number;
  permissions_count: number;
}

export interface RoleStats {
  roles: Role[];
  total_roles: number;
  total_assigned: number;
}

export interface RoleStatsResponse {
  success: boolean;
  data: RoleStats;
  message?: string;
  errors?: {[key: string]: string[]};
}

export interface RegistrationMetrics {
  total_registrations: number;
  growth_rate: number;
  average_daily: number;
  peak_day: string;
}

export interface RegistrationData {
  dates: string[];
  counts: number[];
  metrics: RegistrationMetrics;
  timeframe: string;
}

export interface RegistrationResponse {
  success: boolean;
  data: RegistrationData;
  message?: string;
  errors?: {[key: string]: string[]};
}