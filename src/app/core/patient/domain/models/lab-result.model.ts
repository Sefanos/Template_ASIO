export interface DoctorInfo {
  user_id: number;
  specialty: string;
}
export interface ReviewedBy {
   id: number;
  name: string;
  doctor?: DoctorInfo;
}

export interface StructuredResultComponent {
  component: string;
  value: number | string;
  range: string;
  unit: string;
}

export interface StructuredResults {
  test_name: string;
  results: StructuredResultComponent[];
  overall_status: string;
}

export interface LabResult {
  id: number;
  lab_test_id: number;
  medical_record_id: number | null;
  result_date: string;
  performed_by_lab_name: string;
  result_document_path: string | null;
  structured_results: string;
  parsed_structured_results?: StructuredResults;
  interpretation: string;
  reviewed_by_user_id: number;
  reviewed_by: ReviewedBy;
  status: 'completed' | 'pending' | 'cancelled' | 'in_progress',
  created_at: string;
  updated_at: string;
  patient_id: number;
}

export interface PaginatedLabResultData {
  current_page: number;
  data: LabResult[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  links: { url: string | null; label: string; active: boolean }[];
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
  total: number;
}

export interface LabResultResponse {
    success: boolean;
    message: string;
    data: PaginatedLabResultData;
}