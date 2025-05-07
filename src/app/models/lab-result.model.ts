export interface LabResult {
  id: number;
  name: string;
  value: number;
  unit: string;
  referenceRange: string;
  date: string;
  status: 'normal' | 'abnormal' | 'critical';
  trend?: 'up' | 'down' | 'stable';
  patientId?: number;
  // Additional fields
  orderedBy?: string;
  labName?: string;
  notes?: string;
  history?: {
    date: string;
    value: number;
  }[];
}