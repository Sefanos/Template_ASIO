/**
 * Generic API response structure.
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string | null;
  data: T;
}

/**
 * Pagination details from the API.
 */
export interface Pagination {
  total: number;
  current_page: number;
  per_page: number;
  last_page: number;
  from?: number;
  to?: number;
}

/**
 * Paginated response structure for lists.
 */
export interface PaginatedResponse<T> {
  items: T[];
  pagination: Pagination;
}

/**
 * Represents a summary of a patient associated with a bill.
 */
export interface BillPatientSummary {
  id: number;
  user_id?: number; // Present in list view
  name?: string;    // Present in detail view
  email?: string;   // Present in detail view
  registration_date?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

/**
 * Represents a summary of a doctor associated with a bill.
 */
export interface BillDoctorSummary {
  id: number;
  name: string;
  email: string;
  email_verified_at?: string | null;
  last_login_at?: string | null;
  created_at?: string;
  updated_at?: string;
  phone?: string | null;
  status?: string;
  deleted_at?: string | null;
  password_change_required?: boolean;
  specialty?: string | null; // Present in detail view
}

/**
 * Represents an item within a bill.
 */
export interface BillItem {
  id: number;
  bill_id: number;
  service_type: string;
  description: string;
  price: string | number; // API returns string in some lists, number in details/updates
  quantity?: number;      // Present in list view items
  total: string | number;  // API returns string in some lists, number in details/updates
  created_at: string;
  updated_at: string;
}

/**
 * Represents a bill.
 */
export interface Bill {
  id: number;
  patient_id: number;
  doctor_user_id: number;
  bill_number: string;
  amount: string | number; // API returns string in list, number in detail
  issue_date: string; // Format YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.ssssssZ
  payment_method: string;
  description: string | null;
  pdf_path: string | null;
  created_by_user_id?: number; // Present in list view
  created_at: string;
  updated_at: string;
  // Updated patient structure to match your API response
  patient?: {
    id: number;
    name: string;
    email: string;
    user_id?: number;
    user?: {
      id: number;
      name: string;
      email: string;
      phone?: string;
    }
  };
  // Updated doctor structure to match your API response
  doctor?: {
    id: number;
    name: string;
    email: string;
    phone?: string;
    specialty?: string;
    doctor?: {
      id: number;
      specialty?: string;
    }
  };
  items?: BillItem[];
}

/**
 * Payload for creating a new bill item.
 */
export interface BillItemCreatePayload {
  service_type: string;
  description: string;
  price: number;
  // quantity is assumed to be 1 by default on backend based on POST item response
}

/**
 * Payload for creating a new bill.
 */
export interface BillCreatePayload {
  patient_id: number;
  doctor_user_id: number;
  issue_date: string; // YYYY-MM-DD
  payment_method: string;
  description?: string;
  generate_pdf?: boolean;
  items: BillItemCreatePayload[];
}

/**
 * Payload for updating a bill item.
 */
export interface BillItemUpdatePayload {
  description?: string;
  price?: number;
  service_type?: string; // Assuming service_type can also be updated
  // quantity?: number; // If quantity can be updated
}

/**
 * Parameters for querying the list of bills.
 */
export interface BillListParams {
  page?: number;
  per_page?: number;
  sort_by?: 'issue_date' | 'amount' | 'patient_name' | 'doctor_name' | 'created_at'; // Add more as needed
  sort_order?: 'asc' | 'desc';
  search?: string; // General search term
  patient_id?: number | string; // Can be number or comma-separated string of numbers
  doctor_user_id?: number | string; // Can be number or comma-separated string of numbers
  doctor_name?: string; // Search by doctor's name
  patient_name?: string; // Search by patient's name (if API supports)
  from_date?: string; // YYYY-MM-DD
  to_date?: string; // YYYY-MM-DD
  payment_method?: string | string[]; // Can be string or comma-separated string / array of strings
  amount_min?: number;
  amount_max?: number;
  service_type?: string | string[]; // Can be string or comma-separated string / array of strings
}

/**
 * Doctor information interface
 */
export interface Doctor {
  id: number;
  user_id: number;
  name: string;
  email?: string;
  specialty?: string;
  phone?: string;
}

/**
 * Patient information interface
 */
export interface Patient {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  date_of_birth?: string;
}