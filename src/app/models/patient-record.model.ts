import { VitalSign } from './vital-sign.model';
import { Medication } from './medication.model';
import { Condition } from './condition.model';
import { LabResult } from './lab-result.model';
import { Appointment } from './appointment.model';
import { TimelineEvent } from './timeline-event.model';
import { Note } from './note.model';

export interface PatientRecordData {
  patientId: number;
  vitals: VitalSign[];
  medications: Medication[];
  conditions: Condition[];
  labResults: LabResult[];
  appointments: Appointment[];
  timelineEvents: TimelineEvent[];
  patientNotes: Note[];
}

// Re-export types for backward compatibility
export type { VitalSign, Medication, Condition, LabResult, Appointment, TimelineEvent, Note };