export interface Medication {
  id: number;
  name: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate?: string;
  status: 'active' | 'completed' | 'stopped' | 'on-hold';
  prescribedBy: string;
  notes?: string;
  patientId?: number;
  // Additional fields
  instructions?: string;
  interactions?: string[];
  refills?: number;
  pharmacy?: string;
}