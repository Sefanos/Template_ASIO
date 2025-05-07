export interface Patient {
  id: number;
  name: string;
  dob: string;
  phone: string;
  allergies?: string[];
  alerts?: {
    type: 'warning' | 'danger' | 'info';
    message: string;
  }[];
  vitalSigns: {
    bp: string;
    hr: string;
    temp: string;
    weight: string;
    height: string;
    lastUpdated: string;
    history?: {
      date: string;
      value: string;
    }[];
  };
  medications: {
    name: string;
    instructions: string;
    startDate?: string;
    interactions?: string[];
  }[];
  medicalHistory: {
    condition: string;
    details: string;
    date?: string;
  }[];
  labs: {
    test: string;
    result: string;
    date: string;
    details?: boolean;
    history?: {
      date: string;
      value: string;
    }[];
    referenceRange?: string;
  }[];
  appointments: {
    date: string;
    reason: string;
  }[];
  timeline?: {
    date: string;
    event: string;
    type: 'appointment' | 'medication' | 'lab' | 'diagnosis' | 'procedure';
    details?: string;
  }[];
  notes?: string[];
}