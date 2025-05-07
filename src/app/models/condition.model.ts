export interface Condition {
  id: number;
  name: string;
  status: 'active' | 'resolved' | 'recurrent' | 'chronic';
  onsetDate: string;
  endDate?: string;
  notes?: string;
  patientId?: number;
  // Additional fields
  severity?: 'mild' | 'moderate' | 'severe';
  diagnosedBy?: string;
  treatmentPlan?: string;
}