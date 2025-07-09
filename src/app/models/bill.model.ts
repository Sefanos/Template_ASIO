export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Patient {
  id: number;
  user_id: number;
  registration_date: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  user: User;
}

export interface DoctorInfo {
  id: number;
  user_id: number;
  specialty: string;
  license_number: string;
  experience_years: number;
  consultation_fee: string;
  max_patient_appointments: number;
  is_available: boolean;
  working_hours: string;
  created_at: string;
  updated_at: string;
}

export interface Doctor {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: string;
  created_at: string;
  updated_at: string;
  doctor: DoctorInfo;
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

export interface Pagination {
  total: number;
  current_page: number;
  per_page: number;
  last_page: number;
}

export interface BillsApiResponse {
  success: boolean;
  message: string;
  data: {
    items: Bill[];
    pagination: Pagination;
  };
}