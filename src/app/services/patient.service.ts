import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Patient } from '../models/patient.model';

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
      vitalSigns: {
        bp: '120/80 mmHg',
        hr: '72 bpm',
        temp: '36.7°C',
        weight: '75 kg',
        height: '176 cm',
        lastUpdated: 'Today',
        history: [
          { date: '04/05/2025', value: '120/80 mmHg' },
          { date: '03/04/2025', value: '118/78 mmHg' },
          { date: '02/03/2025', value: '125/82 mmHg' },
          { date: '01/02/2025', value: '130/85 mmHg' },
          { date: '01/01/2025', value: '128/84 mmHg' }
        ]
      },
      medications: [
        { 
          name: 'Lisinopril 10mg', 
          instructions: 'Once daily',
          startDate: '10/01/2022',
          interactions: ['NSAIDs may decrease effectiveness']
        },
        { 
          name: 'Metformin 500mg', 
          instructions: 'Twice daily',
          startDate: '15/02/2019'
        }
      ],
      medicalHistory: [
        { condition: 'Hypertension', details: 'diagnosed 2020', date: '15/06/2020' },
        { condition: 'Type 2 Diabetes', details: 'diagnosed 2018', date: '23/11/2018' },
        { condition: 'Right knee surgery', details: '2015', date: '07/03/2015' }
      ],
      labs: [
        { 
          test: 'HbA1c', 
          result: '6.8%', 
          date: '15/04/2025',
          referenceRange: '4.0-5.6%',
          history: [
            { date: '15/04/2025', value: '6.8%' },
            { date: '15/01/2025', value: '7.1%' },
            { date: '15/10/2024', value: '7.3%' },
            { date: '15/07/2024', value: '7.5%' },
            { date: '15/04/2024', value: '7.7%' }
          ]
        },
        { 
          test: 'Cholesterol Panel', 
          result: '', 
          date: '15/04/2025', 
          details: true 
        }
      ],
      appointments: [
        { date: 'Today', reason: 'Annual checkup' },
        { date: '18/03/2025', reason: 'Follow-up' },
        { date: '05/01/2025', reason: 'Urgent care' }
      ],
      timeline: [
        { date: '04/05/2025', event: 'Annual checkup', type: 'appointment' },
        { date: '15/04/2025', event: 'Lab test: HbA1c', type: 'lab', details: 'Result: 6.8%' },
        { date: '15/04/2025', event: 'Lab test: Cholesterol Panel', type: 'lab' },
        { date: '18/03/2025', event: 'Follow-up appointment', type: 'appointment' },
        { date: '15/01/2025', event: 'Lab test: HbA1c', type: 'lab', details: 'Result: 7.1%' },
        { date: '05/01/2025', event: 'Urgent care visit', type: 'appointment', details: 'Respiratory infection' },
        { date: '15/10/2024', event: 'Lab test: HbA1c', type: 'lab', details: 'Result: 7.3%' },
        { date: '15/07/2024', event: 'Lab test: HbA1c', type: 'lab', details: 'Result: 7.5%' },
        { date: '15/06/2020', event: 'Diagnosis: Hypertension', type: 'diagnosis' },
        { date: '23/11/2018', event: 'Diagnosis: Type 2 Diabetes', type: 'diagnosis' },
        { date: '07/03/2015', event: 'Procedure: Right knee surgery', type: 'procedure' }
      ],
      notes: [
        'Patient reports feeling well overall. Mentions occasional dizziness in the morning.',
        'Patient is compliant with medication regimen. Discussed importance of regular exercise.'
      ]
    },
    {
      id: 456,
      name: 'Marie Laurent',
      dob: '23/08/1982',
      phone: '+33 7 23 45 67',
      vitalSigns: {
        bp: '118/76 mmHg',
        hr: '65 bpm',
        temp: '36.4°C',
        weight: '62 kg',
        height: '168 cm',
        lastUpdated: '5 days ago'
      },
      medications: [
        { name: 'Loratadine 10mg', instructions: 'As needed for allergies' }
      ],
      medicalHistory: [
        { condition: 'Seasonal allergies', details: 'ongoing' },
        { condition: 'Appendectomy', details: '2010' }
      ],
      labs: [
        { test: 'CBC', result: 'Normal', date: '10/04/2025' },
        { test: 'Liver Function', result: 'Normal', date: '10/04/2025' }
      ],
      appointments: [
        { date: '5 days ago', reason: 'Follow-up' },
        { date: '12/02/2025', reason: 'Allergy consultation' }
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
  addPatientNote(patientId: number, note: string): Observable<boolean> {
    const patient = this.samplePatients.find(p => p.id === patientId);
    if (patient) {
      if (!patient.notes) {
        patient.notes = [];
      }
      patient.notes.unshift(note);
      return of(true).pipe(delay(300));
    }
    return of(false).pipe(delay(300));
  }

  /**
   * Schedule an appointment for a patient
   */
  scheduleAppointment(patientId: number, date: string, reason: string): Observable<boolean> {
    const patient = this.samplePatients.find(p => p.id === patientId);
    if (patient) {
      patient.appointments.push({ date, reason });
      return of(true).pipe(delay(300));
    }
    return of(false).pipe(delay(300));
  }
}