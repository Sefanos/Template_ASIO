export interface VitalSign {
  id: number;
  date: string;
  systolic: number;
  diastolic: number;
  pulse: number;
  temperature: number;
  respiratoryRate: number;
  oxygenSaturation: number;
  weight: number;
  height: number;
}

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
}

export interface Condition {
  id: number;
  name: string;
  status: 'active' | 'resolved' | 'recurrent' | 'chronic';
  onsetDate: string;
  endDate?: string;
  notes?: string;
}

export interface LabResult {
  id: number;
  name: string;
  value: number;
  unit: string;
  referenceRange: string;
  date: string;
  status: 'normal' | 'abnormal' | 'critical';
  trend?: 'up' | 'down' | 'stable';
}

export interface Appointment {
  id: number;
  date: string;
  time: string;
  type: string;
  provider: string;
  reason: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
}

export interface TimelineEvent {
  id: number;
  date: string;
  type: 'appointment' | 'medication' | 'labResult' | 'diagnosis' | 'note';
  title: string;
  description: string;
  provider?: string;
  status?: string;
}

export interface Note {
  id: number;
  date: string;
  provider: string;
  content: string;
  type: 'progress' | 'consultation' | 'procedure' | 'quick';
}