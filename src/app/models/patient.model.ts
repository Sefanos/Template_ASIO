import { VitalSign } from './vital-sign.model';
import { Medication } from './medication.model';
import { Condition } from './condition.model';
import { LabResult } from './lab-result.model';
import { Appointment } from './appointment.model';
import { TimelineEvent } from './timeline-event.model';
import { Note } from './note.model';

export interface Alert {
  type: 'warning' | 'danger' | 'info';
  message: string;
}

export interface Patient {
  id: number;
  name: string;
  dob: string;
  phone: string;
  email?: string;
  address?: string;
  gender?: string;
  insuranceProvider?: string;
  insuranceNumber?: string;
  
  // References to other models
  allergies?: string[];
  alerts?: Alert[];
  vitalSigns?: VitalSign[];
  medications?: Medication[];
  conditions?: Condition[];
  labResults?: LabResult[];
  appointments?: Appointment[];
  timelineEvents?: TimelineEvent[];
  notes?: Note[];
}