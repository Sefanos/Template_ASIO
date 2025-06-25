export interface Alert {
  id: number;
  patient_id: number;
  alert_type: 'allergy' | 'warning' | 'medication' | string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AlertsApiResponse {
    success: boolean;
    message: string;
    data: Alert[];
}