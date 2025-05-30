export interface ServiceRendered {
  id: number;
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface Bill {
  id: number; // N° Facture
  patient_id: number;
  amount: number; // Montant
  issue_date: string; // Date (YYYY-MM-DD)
  due_date: string;   // YYYY-MM-DD
  status: string; // Status (ex: "paid")
  notes: string | null;
  pdf_link: string | null; // Lien direct vers le PDF via la route de téléchargement
  created_at: string;
  updated_at: string;

  // Données fournies par le backend
  doctor_name: string | null;
  doctor_specialty: string | null;
  payment_method: string | null;
  services_rendered: ServiceRendered[];
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