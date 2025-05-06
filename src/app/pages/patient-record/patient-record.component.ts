import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

interface Patient {
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

@Component({
  selector: 'app-patient-record',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './patient-record.component.html',
  styleUrl: './patient-record.component.css'
})
export class PatientRecordComponent implements OnInit {
med: any;
getMedicationDuration(arg0: string): number {
  const match = arg0.match(/(\d+)\s*days?/i);
  if (match) {
    return parseInt(match[1], 10);
  }
  throw new Error(`Unable to extract duration from: "${arg0}"`);
}
formatMedicationDate(arg0: string): string {
  const date = new Date(arg0);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date format: "${arg0}"`);
  }

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
parseFloat(arg0: string): number {
  const result = Number.parseFloat(arg0);
  if (isNaN(result)) {
    throw new Error(`Invalid number format: "${arg0}"`);
  }
  return result;
}
  patientId: number | null = null;
  patient: Patient | null = null;
  activeTab: string = 'summary';
  quickNote: string = '';
  showQuickNoteForm: boolean = false;
  showPrintOptions: boolean = false;
  
  // Sample patient data (in a real app, this would come from a service)
  samplePatients: Patient[] = [
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
  
  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}
  
  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');
      if (idParam) {
        this.patientId = parseInt(idParam, 10);
        // Find patient in our sample data
        this.patient = this.samplePatients.find(p => p.id === this.patientId) || null;
      }
    });
  }
  
  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }
  
  goBackToPatientList(): void {
    this.router.navigate(['/patients']);
  }
  
  newPrescription(): void {
    this.router.navigate(['/prescription'], { queryParams: { patientId: this.patientId } });
  }
  
  scheduleAppointment(): void {
    this.router.navigate(['/calendar'], { queryParams: { patientId: this.patientId } });
  }
  
  sendMessage(): void {
    console.log(`Sending message to patient ${this.patientId}`);
  }
  
  orderNewTests(): void {
    console.log(`Ordering new tests for patient ${this.patientId}`);
  }
  
  toggleQuickNoteForm(): void {
    this.showQuickNoteForm = !this.showQuickNoteForm;
  }
  
  saveQuickNote(): void {
    if (this.quickNote.trim() && this.patient) {
      if (!this.patient.notes) {
        this.patient.notes = [];
      }
      this.patient.notes.unshift(this.quickNote);
      this.quickNote = '';
      this.showQuickNoteForm = false;
    }
  }
  
  togglePrintOptions(): void {
    this.showPrintOptions = !this.showPrintOptions;
  }
  
  printSection(section: string): void {
    console.log(`Printing ${section} for patient ${this.patientId}`);
    this.showPrintOptions = false;
    // In a real app, this would generate a printable view of the selected section
  }
  
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
}
