export interface RevenueOverviewData {
  revenue_metrics: {
    total_revenue: number;
    period_revenue: number;
    previous_period_revenue: number;
    growth_rate: number;
    average_bill_amount: number;
    outstanding_amount: number;
  };
  revenue_by_period: {period: string, amount: number}[];
}

export interface ServiceBreakdownData {
  service_breakdown: {
    service_breakdown: {
      service_type: string;
      count: number;
      total_revenue: number;
      average_price: number;
    }[];
  };
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

export interface Bill {
  id: number;
  patient_id: number;
  doctor_user_id: number;
  bill_number: string;
  amount: string;
  issue_date: string;
  due_date: string;
  payment_method: string;
  description: string | null;
  pdf_path: string | null;
  created_by_user_id: number;
  created_at: string;
  updated_at: string;
  patient: {
    id: number;
    user_id: number;
    registration_date: string;
    created_at: string;
    updated_at: string;
  };
  doctor: {
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
  };
  items: BillItem[];
}

export interface BillsResponse {
  items: Bill[];
  pagination: {
    total: number;
    current_page: number;
    per_page: number;
    last_page: number;
  };
}

export interface RevenueMetric {
  label: string;
  value: string | number;
  percentChange?: number;
  status?: 'success' | 'warning' | 'urgent' | 'info';
}

export interface FinancialResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: {[key: string]: string[]};
}