import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Patient } from '../models/patient.model';
import { Note } from '../models/note.model';

@Injectable({
  providedIn: 'root'
})
export class PatientService {
  // Sample patient data (in a real app, this would come from a database or API)
  private samplePatients: Patient[] = [
    {
      id: 123,
      name: 'Jean Dupont',
      dob: '15/07/1975',
      phone: '+33 6 12 34 56',
      allergies: ['Penicillin', 'Peanuts'],
      alerts: [
        { type: 'danger', message: 'Penicillin allergy - Severe reaction' },
        { type: 'warning', message: 'Medication interaction risk with current prescriptions' }
      ],
      vitalSigns: [
        {
          id: 1,
          date: '2025-05-07',
          systolic: 120,
          diastolic: 80,
          pulse: 72,
          temperature: 36.7,
          respiratoryRate: 16,
          oxygenSaturation: 98,
          weight: 75,
          height: 176,
          previousReading: { date: '2025-04-03', value: 118 }, // Example previous reading
        }
      ],
      medications: [
        {
          name: 'Lisinopril 10mg',
          instructions: 'Once daily',
          startDate: '10/01/2022',
          interactions: ['NSAIDs may decrease effectiveness'],
          id: 1, // Assuming IDs for medications
          dosage: '10mg',
          frequency: 'Once daily',
          status: 'active',
          prescribedBy: 'Dr. Smith'
        },
        {
          name: 'Metformin 500mg',
          instructions: 'Twice daily',
          startDate: '15/02/2019',
          id: 2, // Assuming IDs for medications
          dosage: '500mg',
          frequency: 'Twice daily',
          status: 'active',
          prescribedBy: 'Dr. Smith'
        }
      ],
      conditions: [
        { id: 1, name: 'Hypertension', status: 'chronic', onsetDate: '2020-06-15', notes: 'Managed with Lisinopril' },
        { id: 2, name: 'Type 2 Diabetes', status: 'chronic', onsetDate: '2018-11-23', notes: 'Managed with Metformin and diet' }
      ],
      labResults: [
        {
          id: 1,
          name: 'HbA1c',
          value: 6.8,
          unit: '%',
          referenceRange: '4.0-5.6%',
          date: '2025-04-15',
          status: 'abnormal',
          trend: 'stable',
          history: [
            { date: '2025-01-15', value: 7.1 },
            { date: '2024-10-15', value: 7.3 }
          ]
        },
        {
          id: 2,
          name: 'Cholesterol Panel',
          value: 5.0, // This seems to be a placeholder, cholesterol panel has multiple values
          unit: 'mmol/L', // Assuming unit, adjust as needed
          referenceRange: '<5.2 mmol/L (Total)',
          date: '2025-04-15',
          status: 'normal'
        }
      ],
      appointments: [
        {
          date: '2025-05-07', reason: 'Annual checkup', status: 'completed',
          id: 1,
          time: '10:00 AM',
          type: 'Routine',
          provider: 'Dr. Sefanos'
        },
        {
          date: '2025-03-18', reason: 'Follow-up',
          status: 'scheduled',
          id: 2,
          time: '02:30 PM',
          type: 'Follow-up',
          provider: 'Dr. Sefanos'
        },
        {
          date: '2025-01-05', reason: 'Urgent care',
          status: 'completed',
          id: 3,
          time: '09:15 AM',
          type: 'Urgent',
          provider: 'Dr. Sefanos'
        },
        {
          date: '2024-12-01', reason: 'Consultation',
          status: 'completed',
          id: 4,
          time: '11:00 AM',
          type: 'Consultation',
          provider: 'Dr. Sefanos'
        },
        {
          date: '2024-11-15', reason: 'Physical Exam',
          status: 'completed',
          id: 5,
          time: '03:00 PM',
          type: 'Routine',
          provider: 'Dr. Sefanos'
        }
      ],
      timelineEvents: [
        { id: 1, date: '2025-05-07', type: 'appointment', title: 'Annual checkup', description: 'Completed annual checkup with Dr. Sefanos.' },
        { id: 2, date: '2025-04-15', type: 'labResult', title: 'Lab test: HbA1c', description: 'Result: 6.8%' },
        { id: 3, date: '2025-03-18', type: 'appointment', title: 'Follow-up appointment', description: 'Scheduled follow-up with Dr. Sefanos.' },
      ],
      notes: [ // Updated to Note[]
        {
          id: 1,
          date: '2025-05-01',
          provider: 'Dr. Sefanos',
          content: 'Patient reports feeling well overall. Mentions occasional dizziness in the morning.',
          type: 'progress'
        },
        {
          id: 2,
          date: '2025-04-15',
          provider: 'Dr. Sefanos',
          content: 'Patient is compliant with medication regimen. Discussed importance of regular exercise.',
          type: 'progress'
        }
      ]
    },
    {
      id: 456,
      name: 'Marie Laurent',
      dob: '23/08/1982',
      phone: '+33 7 23 45 67',
      vitalSigns: [
        {
          id: 2, // Assuming a different ID for Marie's vitals
          date: '2025-05-02', // '5 days ago' from May 7, 2025
          systolic: 118,
          diastolic: 76,
          pulse: 65,
          temperature: 36.4,
          respiratoryRate: 15,
          oxygenSaturation: 99,
          weight: 62,
          height: 168
        }
      ],
      medications: [
        {
          name: 'Loratadine 10mg', instructions: 'As needed for allergies',
          id: 3, // Assuming IDs
          dosage: '10mg',
          frequency: 'As needed',
          startDate: '2023-01-01',
          status: 'active',
          prescribedBy: 'Dr. Davis'
        }
      ],
      conditions: [
        { id: 3, name: 'Seasonal allergies', status: 'active', onsetDate: '2000-01-01', notes: 'Managed with Loratadine' },
        { id: 4, name: 'Appendectomy', status: 'resolved', onsetDate: '2010-05-15', endDate: '2010-05-20' }
      ],
      labResults: [
        { id: 3, name: 'CBC', value: 0, unit: '', referenceRange: 'Normal', date: '2025-04-10', status: 'normal' }, // CBC usually has multiple values, placeholder here
        { id: 4, name: 'Liver Function', value: 0, unit: '', referenceRange: 'Normal', date: '2025-04-10', status: 'normal' } // Same for LFTs
      ],
      appointments: [
        {
          date: '2025-05-02', reason: 'Follow-up',
          status: 'completed',
          id: 6,
          time: '10:00 AM',
          type: 'Follow-up',
          provider: 'Dr. Davis'
        },
        {
          date: '2025-02-12', reason: 'Allergy consultation',
          status: 'completed',
          id: 7,
          time: '11:30 AM',
          type: 'Consultation',
          provider: 'Dr. Miller'
        }
      ],
      notes: [ // Added sample notes for Marie Laurent
        {
          id: 3,
          date: '2025-05-02',
          provider: 'Dr. Davis',
          content: 'Discussed allergy management. Patient reports improvement with Loratadine.',
          type: 'consultation'
        }
      ]
    }
  ];

  constructor() {}

  /**
   * Get a patient by ID
   */
  getPatientById(id: number): Observable<Patient | null> {
    // Simulate API call with a delay
    const patient = this.samplePatients.find(p => p.id === id) || null;
    return of(patient).pipe(delay(500));
  }

  /**
   * Get all patients
   */
  getAllPatients(): Observable<Patient[]> {
    // Simulate API call with a delay
    return of(this.samplePatients).pipe(delay(500));
  }

  /**
   * Add a note to a patient record
   */
  addPatientNote(patientId: number, noteContent: string): Observable<boolean> {
    const patient = this.samplePatients.find(p => p.id === patientId);
    if (patient) {
      if (!patient.notes) {
        patient.notes = [];
      }
      const newNote: Note = {
        id: patient.notes.length > 0 ? Math.max(...patient.notes.map(n => n.id)) + 1 : 1, // Simple ID generation
        date: new Date().toISOString().split('T')[0], // Current date in YYYY-MM-DD format
        provider: 'Current User', // Placeholder provider
        content: noteContent,
        type: 'quick', // Default type for new notes
      };
      patient.notes.unshift(newNote); // Add to the beginning of the array
      return of(true).pipe(delay(300));
    }
    return of(false).pipe(delay(300));
  }

  /**
   * Schedule an appointment for a patient
   */
  scheduleAppointment(patientId: number, date: string, reason: string, time: string, type: string, provider: string): Observable<boolean> {
    const patient = this.samplePatients.find(p => p.id === patientId);
    if (patient) {
      if (!patient.appointments) {
        patient.appointments = [];
      }
      const newAppointmentId = patient.appointments.length > 0 ? Math.max(...patient.appointments.map(a => a.id)) + 1 : 1;
      patient.appointments.push({
        id: newAppointmentId,
        date,
        time, // Added time
        reason,
        type, // Added type
        provider, // Added provider
        status: 'scheduled' // New appointments are scheduled
      });
      return of(true).pipe(delay(300));
    }
    return of(false).pipe(delay(300));
  }
}