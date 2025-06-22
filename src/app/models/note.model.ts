export interface Note {
  id: number;
  date: string;
  provider: string;
  content: string;
  type: 'progress' | 'consultation' | 'procedure' | 'quick';
  patientId?: number;
  // Additional fields
  title?: string;
  followUpRequired?: boolean;
  followUpDate?: string;
  attachments?: string[];
  tags?: string[];
}

// New interface to match the API response structure
export interface ApiPatientNote {
  id: number;
  patient_id: number;
  note_type: string;
  note_content: string;
  created_at: string;
  updated_at: string;
  doctor_id: number;
  canEdit: boolean;
  // Doctor information (populated by join)
  doctor?: {
    id: number;
    name: string;
    specialization?: string;
  };
  // Additional fields
  title?: string;
  priority?: 'low' | 'medium' | 'high';
  tags?: string[];
}