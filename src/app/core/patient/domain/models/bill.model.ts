// filepath: c:\Users\Microsoft\Documents\portail\Template_ASIO\src\app\core\patient\domain\models\bill.model.ts
export interface BillItem {
  id: number;
  bill_id: number;
  service_type: string; // e.g., "CONSULT", "PHYSIO"
  description: string; // Detailed description of the service
  price: number; // Unit price
  quantity?: number; // Quantity, might be optional or not present in all contexts
  total: number; // Total price for this item
  created_at?: string;
  updated_at?: string;
}

export interface DoctorInfo {
  id: number;
  name: string;
  specialty?: string | null; // Specialty might be optional
  email?: string; // from list example
}

export interface Bill {
  id: number; // Numerical ID of the bill
  patient_id?: number; // Optional, as it's contextually known for patient's bills
  doctor_user_id?: number;
  bill_number: string; // User-facing bill number, e.g., "BILL-20241107..."
  amount: number; // Total amount of the bill
  issue_date: string; // Date string (e.g., "YYYY-MM-DD" or ISO string)
  due_date?: string | null; // Optional, may not be in all responses
  // status: string; // Removed as it's not in the new API response
  description: string | null; // General description or notes for the bill
  pdf_path: string | null; // Path or link to the PDF
  payment_method: string | null;
  created_at: string;
  updated_at: string;
  created_by_user_id?: number;

  doctor: DoctorInfo;
  items: BillItem[]; // Renamed from services_rendered and structure updated

  // Fields that were in the old model but might not be directly in the new root
  // doctor_name: string | null; // Now under doctor.name
  // doctor_specialty: string | null; // Now under doctor.specialty
}

export interface BackendPagination {
  total: number;
  current_page: number;
  per_page: number;
  last_page: number;
  from?: number; // Assuming these might be available
  to?: number;
  first_page_url?: string;
  last_page_url?: string;
  next_page_url?: string | null;
  prev_page_url?: string | null;
  path?: string;
  links?: { url: string | null; label: string; active: boolean }[];
}

export interface PaginatedBillResponse {
  items: Bill[];
  pagination: BackendPagination;
}

// This is the structure the frontend components will expect after service mapping
export interface FrontendPaginatedResponse<T> {
  data: T[];
  current_page: number;
  first_page_url?: string;
  from?: number;
  last_page: number;
  last_page_url?: string;
  links?: { url: string | null; label: string; active: boolean }[];
  next_page_url: string | null;
  path?: string;
  per_page: number;
  prev_page_url: string | null;
  to?: number;
  total: number;
}