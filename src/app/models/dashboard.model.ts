export interface DashboardAppointment {
  id: number;
  patient_name: string;
  patient_id: number;
  appointment_type: string;
  scheduled_date: string;
  scheduled_time: string;
  status: string;
  duration?: number;
  notes?: string;
  reason?: string;
}

export interface DashboardPatient {
  id: number;
  user_id: number;
  registration_date: string;
  total_appointments: number;
  upcoming_appointments: number;
  critical_alerts_count: number;
  user: {
    id: number;
    name: string;
    email: string;
    phone: string;
    status: string;
  };
  personal_info: {
    patient_id: number;
    name: string;
    surname: string;
    birthdate: string;
    gender: string;
  };
}
