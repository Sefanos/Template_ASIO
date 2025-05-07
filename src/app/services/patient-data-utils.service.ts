import { Injectable } from '@angular/core';
import { Patient } from '../models/patient.model';
import {
  VitalSign,
  Medication,
  Condition,
  LabResult,
  Appointment,
  TimelineEvent,
  Note
} from '../models/patient-record.model';

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
    return [{
      id: 1,
      date: patient.vitalSigns.lastUpdated,
      systolic: this.getSystolic(patient.vitalSigns.bp),
      diastolic: this.getDiastolic(patient.vitalSigns.bp),
      pulse: this.getNumericValue(patient.vitalSigns.hr),
      temperature: parseFloat(patient.vitalSigns.temp),
      respiratoryRate: 16, // Default value
      oxygenSaturation: 98, // Default value
      weight: parseFloat(patient.vitalSigns.weight),
      height: parseFloat(patient.vitalSigns.height)
    }];
  }

  /**
   * Transform medications from the patient data
   */
  private transformMedications(patient: Patient): Medication[] {
    return patient.medications.map((med, index) => ({
      id: index + 1,
      name: med.name,
      dosage: med.instructions.split(' ')[0],
      frequency: med.instructions,
      startDate: med.startDate || '',
      status: 'active',
      prescribedBy: 'Dr. Sefanos',
      notes: med.interactions ? med.interactions.join(', ') : undefined
    }));
  }

  /**
   * Transform conditions from the patient data
   */
  private transformConditions(patient: Patient): Condition[] {
    return patient.medicalHistory.map((condition, index) => ({
      id: index + 1,
      name: condition.condition,
      status: condition.condition.includes('surgery') ? 'resolved' : 'active',
      onsetDate: condition.date || '',
      notes: condition.details
    }));
  }

  /**
   * Transform lab results from the patient data
   */
  private transformLabResults(patient: Patient): LabResult[] {
    return patient.labs.map((lab, index) => ({
      id: index + 1,
      name: lab.test,
      value: parseFloat(lab.result) || 0,
      unit: lab.result.replace(/[\d.]/g, ''),
      referenceRange: lab.referenceRange || '',
      date: lab.date,
      status: this.isNormalLabValue(lab.result) ? 'normal' : 
              this.isWarningLabValue(lab.result) ? 'abnormal' : 'critical',
      trend: lab.history && lab.history.length > 1 ? 
            (parseFloat(lab.history[0].value) < parseFloat(lab.history[1].value) ? 'down' : 
             parseFloat(lab.history[0].value) > parseFloat(lab.history[1].value) ? 'up' : 'stable') : undefined
    }));
  }

  /**
   * Transform appointments from the patient data
   */
  private transformAppointments(patient: Patient): Appointment[] {
    return patient.appointments.map((appt, index) => ({
      id: index + 1,
      date: appt.date,
      time: '9:00 AM',
      type: 'Regular checkup',
      provider: 'Dr. Sefanos',
      reason: appt.reason,
      status: appt.date === 'Today' ? 'scheduled' : 
              appt.date.includes('days ago') ? 'completed' : 'scheduled'
    }));
  }

  /**
   * Transform timeline events from the patient data
   */
  private transformTimelineEvents(patient: Patient): TimelineEvent[] {
    return patient.timeline?.map((event, index) => ({
      id: index + 1,
      date: event.date,
      type: event.type === 'lab' ? 'labResult' : 
            (event.type as 'appointment' | 'medication' | 'labResult' | 'diagnosis' | 'note'),
      title: event.event,
      description: event.details || '',
      provider: 'Dr. Sefanos',
      status: event.type === 'appointment' ? 
              (new Date(event.date) > new Date() ? 'scheduled' : 'completed') : undefined
    })) || [];
  }

  /**
   * Transform notes from the patient data
   */
  private transformNotes(patient: Patient): Note[] {
    return patient.notes?.map((note, index) => ({
      id: index + 1,
      date: new Date(2025, 4 - index, 6 - index * 7).toISOString(),
      provider: 'Dr. Sefanos',
      content: note,
      type: index === 0 ? 'quick' : 'progress'
    })) || [];
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