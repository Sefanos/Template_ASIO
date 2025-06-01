import { Injectable } from '@angular/core';
import { Patient } from '../../models/patient.model';
import {
  VitalSign,
  Medication,
  Condition,
  LabResult,
  Appointment,
  TimelineEvent,
  Note
} from '../../models/patient-record.model';

@Injectable({
  providedIn: 'root'
})
export class PatientDataUtilsService {
  constructor() {}

  /**
   * Transforms raw patient data into component-friendly formats
   */
  transformPatientData(patient: Patient): {
    vitals: VitalSign[];
    medications: Medication[];
    conditions: Condition[];
    labResults: LabResult[];
    appointments: Appointment[];
    timelineEvents: TimelineEvent[];
    patientNotes: Note[];
  } {
    return {
      vitals: this.transformVitalSigns(patient),
      medications: this.transformMedications(patient),
      conditions: this.transformConditions(patient),
      labResults: this.transformLabResults(patient),
      appointments: this.transformAppointments(patient),
      timelineEvents: this.transformTimelineEvents(patient),
      patientNotes: this.transformNotes(patient)
    };
  }

  /**
   * Transform vitals from the patient data
   */
  private transformVitalSigns(patient: Patient): VitalSign[] {
    // If patient already has vitalSigns in the correct format, return them
    if (patient?.vitalSigns && Array.isArray(patient.vitalSigns)) {
      return [...patient.vitalSigns];
    }
    
    // Default empty vitals if none exist
    return [];
  }

  /**
   * Transform medications from the patient data
   */
  private transformMedications(patient: Patient): Medication[] {
    if (!patient?.medications || !Array.isArray(patient.medications)) {
      return [];
    }
    
    return patient.medications.map((med, index) => {
      const medication: Medication = {
        id: med.id || index + 1,
        name: med.name,
        dosage: med.dosage || (med.instructions ? med.instructions.split(' ')[0] : ''),
        frequency: med.frequency || (med.instructions || ''),
        startDate: med.startDate || '',
        status: med.status || 'active',
        prescribedBy: med.prescribedBy || 'Dr. Sefanos',
        notes: med.notes || (med.interactions ? med.interactions.join(', ') : '')
      };
      return medication;
    });
  }

  /**
   * Transform conditions from the patient data
   */
  private transformConditions(patient: Patient): Condition[] {
    // Use conditions directly if available in correct format
    if (patient?.conditions && Array.isArray(patient.conditions)) {
      return [...patient.conditions];
    }
    
    return [];
  }

  /**
   * Transform lab results from the patient data
   */
  private transformLabResults(patient: Patient): LabResult[] {
    // Use labResults directly if available in correct format
    if (patient?.labResults && Array.isArray(patient.labResults)) {
      return [...patient.labResults];
    }
    
    return [];
  }

  /**
   * Transform appointments from the patient data
   */
  private transformAppointments(patient: Patient): Appointment[] {
    if (!patient?.appointments || !Array.isArray(patient.appointments)) {
      return [];
    }
    
    return patient.appointments.map((appt): Appointment => ({
      id: appt.id,
      date: appt.date,
      time: appt.time || '9:00 AM',
      type: appt.type || 'Regular checkup',
      doctorId: appt.doctorId || 1,
      reason: appt.reason,
      status: appt.status || 'scheduled',
      patientId: appt.patientId || 1,
      patientName: appt.patientName || 'John Doe',
      doctorName: appt.doctorName || 'Dr. Sefanos',
      duration: appt.duration || 30, // Default to 30 minutes
      isBlockedTime: appt.isBlockedTime || false, 
    }));
  }

  /**
   * Transform timeline events from the patient data
   */
  private transformTimelineEvents(patient: Patient): TimelineEvent[] {
    // Use timelineEvents directly if available in correct format
    if (patient?.timelineEvents && Array.isArray(patient.timelineEvents)) {
      return [...patient.timelineEvents];
    }
    
    return [];
  }

  /**
   * Transform notes from the patient data
   */
  private transformNotes(patient: Patient): Note[] {
    if (!patient?.notes || !Array.isArray(patient.notes)) {
      return [];
    }
    
    // If notes are already in the correct format, return them directly
    if (patient.notes.length > 0 && typeof patient.notes[0] === 'object' && 'content' in patient.notes[0]) {
      return [...patient.notes] as Note[];
    }
    
    // Otherwise transform from string format (legacy) to Note objects
    return (patient.notes as unknown as string[]).map((note, index) => ({
      id: index + 1,
      date: new Date(2025, 4 - index, 6 - index * 7).toISOString().split('T')[0],
      provider: 'Dr. Sefanos',
      content: note,
      type: index === 0 ? 'quick' : 'progress'
    }));
  }

  /**
   * Get timeline icon for a given event type
   */
  getTimelineIcon(type: string): string {
    switch(type) {
      case 'appointment': return 'calendar';
      case 'medication': return 'pill';
      case 'lab': return 'flask';
      case 'diagnosis': return 'stethoscope';
      case 'procedure': return 'scalpel';
      default: return 'circle';
    }
  }

  /**
   * Extracts a numeric value from the blood pressure string for visualization
   * Handles strings like "120/80 mmHg" by extracting the systolic pressure (120)
   */
  getNumericValue(value: string): number {
    if (!value) return 0;
    
    // For blood pressure values (e.g. "120/80 mmHg")
    if (value.includes('/')) {
      const systolic = value.split('/')[0];
      return Number(systolic);
    }
    
    // For other values, extract numbers
    const numericValue = value.replace(/[^\d.]/g, '');
    return Number(numericValue) || 0;
  }
  
  /**
   * Calculates height percentage for lab value charts
   */
  calculateLabPercentage(valueStr: string): number {
    const value = this.parseLabValue(valueStr);
    // Scale to reasonable chart height (between 10% and 100%)
    return Math.min(Math.max((value / 10) * 100, 10), 100);
  }
  
  /**
   * Safely parses a lab value from string to number
   */
  parseLabValue(valueStr: string): number {
    try {
      // Extract numeric portion from string like "6.8%"
      return parseFloat(valueStr.replace(/[^\d.]/g, '')) || 0;
    } catch (e) {
      return 0;
    }
  }
  
  /**
   * Determines if lab value is in normal range
   */
  isNormalLabValue(valueStr: string): boolean {
    const value = this.parseLabValue(valueStr);
    // HbA1c normal is < 5.7%
    return value <= 5.6;
  }
  
  /**
   * Determines if lab value is in warning range
   */
  isWarningLabValue(valueStr: string): boolean {
    const value = this.parseLabValue(valueStr);
    // HbA1c prediabetes is 5.7% - 6.9%
    return value > 5.6 && value < 7.0;
  }
  
  /**
   * Determines if lab value is in danger range
   */
  isDangerLabValue(valueStr: string): boolean {
    const value = this.parseLabValue(valueStr);
    // HbA1c diabetes is >= 7.0%
    return value >= 7.0;
  }
  
  /**
   * Extracts the systolic value from a blood pressure reading
   * @param bpValue Blood pressure string like "120/80 mmHg"
   */
  getSystolic(bpValue: string): number {
    if (!bpValue || !bpValue.includes('/')) return 0;
    return parseInt(bpValue.split('/')[0].trim(), 10);
  }
  
  /**
   * Extracts the diastolic value from a blood pressure reading
   * @param bpValue Blood pressure string like "120/80 mmHg"
   */
  getDiastolic(bpValue: string): number {
    if (!bpValue || !bpValue.includes('/')) return 0;
    const parts = bpValue.split('/');
    if (parts.length < 2) return 0;
    return parseInt(parts[1].trim().split(' ')[0], 10);
  }
  
  /**
   * Calculates the height percentage for BP visualization
   * @param value BP value (systolic or diastolic)
   */
  getBpHeightPercentage(value: number): number {
    // Map BP values to chart height (0-100%)
    // Max height (100%) should be around 180mmHg
    // Min height (10%) should be around 40mmHg
    
    const maxBP = 180; // Maximum BP to display at full height
    const minBP = 40;  // Minimum BP to display
    const range = maxBP - minBP;
    
    // Calculate percentage with bounds checking
    const percentage = Math.min(100, Math.max(5, ((value - minBP) / range) * 100));
    return percentage;
  }
  
  /**
   * Format BP date for display in the chart
   */
  formatBpDate(dateStr: string): string {
    // Return only month and day without the year for cleaner display
    const parts = dateStr.split('/');
    if (parts.length >= 2) {
      return `${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  }

  /**
   * Extract medication duration from instructions
   */
  getMedicationDuration(instructions: string): number {
    const match = instructions.match(/(\d+)\s*days?/i);
    if (match) {
      return parseInt(match[1], 10);
    }
    return 0;
  }

  /**
   * Format medication date
   */
  formatMedicationDate(dateStr: string): string {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return dateStr;
    }

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
}