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

// Doctor Revenue Analytics Interfaces
export interface DoctorRevenue {
  doctor_id: number;
  doctor_name: string;
  total_revenue: number;
  bill_count: number;
  average_bill_amount: number;
}

export interface DoctorRevenueResponse {
  success: boolean;
  data: {
    doctor_revenue: DoctorRevenue[];
  };
  message?: string;
  errors?: {[key: string]: string[]};
}

export interface ServiceBreakdown {
  service_type: string;
  count: number;
  total_revenue: number;
  average_price: number;
}

export interface ServiceBreakdownResponse {
  success: boolean;
  data: {
    service_breakdown: ServiceBreakdown[];
  };
  message?: string;
  errors?: {[key: string]: string[]};
}

export interface RevenueTimeframe {
  total_revenue: number;
  average_bill_amount: number;
  bill_count: number;
  start_date: string;
  end_date: string;
  daily_breakdown?: PeriodRevenue[];
  monthly_breakdown?: PeriodRevenue[];
}

export interface PeriodRevenue {
  period: string | number;
  amount: number;
}

export interface RevenueTimeframeResponse {
  success: boolean;
  data: RevenueTimeframe;
  message?: string;
  errors?: {[key: string]: string[]};
}

export interface BillItem {
  id: number;
  bill_id: number;
  service_type: string;
  description: string;
  price: string;
  quantity: number;
  total: string;
  created_at: string;
  updated_at: string;
}

export interface Doctor {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
  phone: string;
  status: string;
  deleted_at: string | null;
  password_change_required: boolean;
}

export interface Patient {
  id: number;
  user_id: number;
  registration_date: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Bill {
  id: number;
  patient_id: number;
  doctor_user_id: number;
  bill_number: string;
  amount: string;
  issue_date: string;
  payment_method: string;
  description: string | null;
  pdf_path: string | null;
  created_by_user_id: number;
  created_at: string;
  updated_at: string;
  patient: Patient;
  doctor: Doctor;
  items: BillItem[];
}

export interface BillsResponse {
  success: boolean;
  message: string;
  data: {
    items: Bill[];
  };
}