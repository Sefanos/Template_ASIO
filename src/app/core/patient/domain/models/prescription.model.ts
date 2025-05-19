export class Prescription {
}

export interface MedicalRecordItem {
  id: string;
  type:  'LabResult' | 'Image' | 'Prescription';
  title: string;
  recordDate: string;
  doctor?: string;
  summary: string;
  details: string;
  tagText: string;
  tagClass: string;
  resultDate?: string;
  performedBy?: string;
  imageDetails?: string;
  takenBy?: string;
  imageUrl?: string;
  status?: string; // 'active', 'completed', 'draft', 'cancelled', etc. (vient du displayStatus du backend)
  dbStatus?: string; 
}