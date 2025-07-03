import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router'; // <-- Add this

// Updated interface to match real API data structure
interface ApiMedicalHistory {
  id: number;
  conditions: string; // JSON string array
  surgeries: string;   // JSON string array
  chronicDiseases: string; // JSON string array
  medications: string; // JSON string array
  allergies: string;   // JSON string array
  lastUpdated: string;
  updatedBy: string;
}

// Legacy interface
interface Condition {
  id: number;
  name: string;
  status: 'active' | 'resolved' | 'recurrent' | 'chronic';
  onsetDate: string;
  endDate?: string;
  notes?: string;
}

@Component({
  selector: 'app-medical-history-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './medical-history-card.component.html',
})
export class MedicalHistoryCardComponent {
  @Input() conditions: any[] = [];
  @Input() patientId!: string | number;
  @Output() navigateToTab = new EventEmitter<string>(); // <-- Add this

  constructor(private router: Router) {}

  showAll: boolean = false;
  
  get medicalHistoryData(): any {
    // If we have the new API format, it's usually the first item
    if (this.conditions && this.conditions.length > 0 && this.conditions[0].conditions) {
      return this.conditions[0];
    }
    return null;
  }
  
  getParsedField(field: any): string[] {
    if (Array.isArray(field)) {
      return field;
    }
    if (typeof field === 'string') {
      try {
        return JSON.parse(field);
      } catch {
        return [];
      }
    }
    return [];
  }
  
  get parsedConditions(): string[] {
    const data = this.medicalHistoryData;
    return data ? this.getParsedField(data.conditions) : [];
  }
  
  get parsedAllergies(): string[] {
    const data = this.medicalHistoryData;
    return data ? this.getParsedField(data.allergies) : [];
  }
  
  get parsedSurgeries(): string[] {
    const data = this.medicalHistoryData;
    return data ? this.getParsedField(data.surgeries) : [];
  }
  
  get parsedChronicDiseases(): string[] {
    const data = this.medicalHistoryData;
    return data ? this.getParsedField(data.chronicDiseases) : [];
  }
  
  get displayConditions(): string[] {
    const conditions = this.parsedConditions;
    return this.showAll ? conditions : conditions.slice(0, 3);
  }
  
  get displayAllergies(): string[] {
    const allergies = this.parsedAllergies;
    return this.showAll ? allergies : allergies.slice(0, 3);
  }
  
  get hasMoreItems(): boolean {
    return this.parsedConditions.length > 3 || this.parsedAllergies.length > 3;
  }
  
  getLastUpdated(): string {
    const data = this.medicalHistoryData;
    return data?.lastUpdated || '';
  }
  
  getUpdatedBy(): string {
    const data = this.medicalHistoryData;
    return data?.updatedBy || 'Unknown';
  }
  
  getConditionSeverity(condition: string): string {
    const highRisk = ['Cancer', 'Heart Disease', 'Stroke', 'Diabetes', 'Depression'];
    const mediumRisk = ['Hypertension', 'Asthma', 'GERD', 'Anxiety'];
    
    if (highRisk.some(risk => condition.toLowerCase().includes(risk.toLowerCase()))) {
      return 'high';
    } else if (mediumRisk.some(risk => condition.toLowerCase().includes(risk.toLowerCase()))) {
      return 'medium';
    }
    return 'low';
  }
  
  getSeverityColor(severity: string): string {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }
  
  getAllergySeverity(allergy: string): string {
    const severe = ['Peanuts', 'Shellfish', 'Penicillin', 'Aspirin'];
    return severe.some(s => allergy.toLowerCase().includes(s.toLowerCase())) ? 'severe' : 'mild';
  }
  
  getAllergySeverityColor(severity: string): string {
    return severity === 'severe' 
      ? 'bg-red-100 text-red-800 border-red-200' 
      : 'bg-orange-100 text-orange-800 border-orange-200';
  }
  
  toggleShowAll(): void {
    this.showAll = !this.showAll;
  }

  goToMedicalHistoryTab(): void {
    this.navigateToTab.emit('history');
  }
}
