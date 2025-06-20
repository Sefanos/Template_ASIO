import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

// Updated interface to match real API data structure
interface ApiMedication {
  id: number;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  status: string;
  startDate: string;
  endDate: string | null;
  instructions: string;
  refillsAllowed: string;
  prescribedBy: string;
  isActive: boolean;
  isExpired: boolean;
}

@Component({
  selector: 'app-medications-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './medications-card.component.html',
})
export class MedicationsCardComponent {
  @Input() medications: any[] = []; // Accept both old and new format
  
  showAll: boolean = false;
  
  get activeMedications(): any[] {
    return this.medications.filter(med => 
      med.isActive || med.status === 'active' || med.status === 'on-hold'
    );
  }
  
  get displayMedications(): any[] {
    const meds = this.activeMedications;
    return this.showAll ? meds : meds.slice(0, 3);
  }
  
  get hasMoreMedications(): boolean {
    return this.activeMedications.length > 3;
  }
  
  // Helper methods for medication data
  getMedicationName(med: any): string {
    return med.name || 'Unknown Medication';
  }
  
  getMedicationDosage(med: any): string {
    return med.dosage || 'N/A';
  }
  
  getMedicationFrequency(med: any): string {
    return med.frequency || 'N/A';
  }
  
  getMedicationInstructions(med: any): string {
    return med.instructions || med.notes || 'No special instructions';
  }
  
  getMedicationStatus(med: any): string {
    if (med.isExpired) return 'expired';
    if (med.isActive || med.status === 'active') return 'active';
    return med.status || 'inactive';
  }
  
  getMedicationStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'stopped': return 'bg-gray-100 text-gray-800';
      case 'on-hold': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
  
  getMedicationStatusIcon(status: string): string {
    switch (status.toLowerCase()) {
      case 'active': return '✓';
      case 'expired': return '⚠';
      case 'completed': return '✓';
      case 'stopped': return '■';
      case 'on-hold': return '⏸';
      default: return '?';
    }
  }
  
  getPrescribedBy(med: any): string {
    return med.prescribedBy || 'Unknown Doctor';
  }
  
  getStartDate(med: any): string {
    return med.startDate || '';
  }
  
  getRefillsInfo(med: any): string {
    if (med.refillsAllowed) {
      return `${med.refillsAllowed} refills allowed`;
    }
    return 'No refill info';
  }
  
  toggleShowAll(): void {
    this.showAll = !this.showAll;
  }
}
