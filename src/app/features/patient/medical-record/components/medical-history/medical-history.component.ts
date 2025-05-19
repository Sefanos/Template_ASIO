import { Component, Input } from '@angular/core';
// Interfaces typically would be in a shared models file
export interface VitalSign {
  label: string;
  value: string;
  unit: string;
  icon: string;
}
export interface VitalSignsData {
  lastRecorded: string | Date | null;
  bloodPressure?: VitalSign;
  pulse?: VitalSign;
  temperature?: VitalSign;
  respiratoryRate?: VitalSign;
  oxygenSaturation?: VitalSign;
  weight?: VitalSign;
  height?: VitalSign;
}
export interface MedicalHistoryData {
  currentMedicalConditions: string[];
  pastSurgeries: string[];
  chronicDiseases: string[];
  currentMedications: string[];
  allergies: string[];
  vitalSigns?: VitalSignsData;
  lastUpdated: string | Date | null;
}

interface MedicalHistorySectionConfig {
  key: keyof MedicalHistoryData; // Keep as keyof MedicalHistoryData for type safety
  title: string;
  color: string; 
  emptyText: string;
  data: string[] | undefined; // To hold the actual data for the section
}
@Component({
  selector: 'app-medical-history',
  standalone: false,
  templateUrl: './medical-history.component.html',
  styleUrl: './medical-history.component.css'
})
export class MedicalHistoryComponent {
  @Input() medicalHistory: MedicalHistoryData | null = null;
  @Input() isLoading: boolean = true;
  @Input() errorMessage: string | null = null;

  // Moved from parent, will be dynamically populated if medicalHistory is available
  medicalHistorySections: MedicalHistorySectionConfig[] = []; 

  ngOnChanges() { // Use ngOnChanges to react to input changes
    if (this.medicalHistory) {
      this.medicalHistorySections = [
        { key: 'currentMedicalConditions', title: 'Current Medical Conditions', color: 'status-info', emptyText: 'No current medical conditions recorded.', data: this.medicalHistory.currentMedicalConditions },
        { key: 'pastSurgeries', title: 'Past Surgeries', color: 'status-success', emptyText: 'No past surgeries recorded.', data: this.medicalHistory.pastSurgeries },
        { key: 'chronicDiseases', title: 'Chronic Diseases', color: 'status-warning', emptyText: 'No chronic diseases recorded.', data: this.medicalHistory.chronicDiseases },
        { key: 'currentMedications', title: 'Current Medications', color: 'accent', emptyText: 'No current medications recorded.', data: this.medicalHistory.currentMedications },
        { key: 'allergies', title: 'Allergies', color: 'status-urgent', emptyText: 'No allergies recorded.', data: this.medicalHistory.allergies }
      ];
    } else {
      this.medicalHistorySections = []; // Clear sections if no history
    }
  }
}
