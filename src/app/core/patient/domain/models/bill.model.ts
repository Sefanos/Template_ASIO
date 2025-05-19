export interface Bill {
  id: number;
  patient_id: number;
  amount: number;
  issue_date: string; // YYYY-MM-DD
  due_date: string;   // YYYY-MM-DD
  
  status: string;
  notes: string | null;
  pdf_link: string | null; // Lien direct vers le PDF ou la route de téléchargement
  created_at: string;
  updated_at: string;
}
export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
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