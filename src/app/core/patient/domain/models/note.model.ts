export interface Doctor {
  id: number;
  name: string;
}

export interface Note {
  id: number;
  patient_id: number;
  doctor_id: number;
  note_type: string;
  title: string;
  content: string;
  is_private: boolean;
  created_at: string;
  updated_at: string;
  doctor: Doctor;
}