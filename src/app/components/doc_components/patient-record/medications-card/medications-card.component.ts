import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Medication {
  id: number;
  name: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate?: string;
  status: 'active' | 'completed' | 'stopped' | 'on-hold';
  prescribedBy: string;
  notes?: string;
}

@Component({
  selector: 'app-medications-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './medications-card.component.html',
})
export class MedicationsCardComponent {
  @Input() medications: Medication[] = [];
  
  showAll: boolean = false;
  
  get activeMedications(): Medication[] {
    return this.medications.filter(med => med.status === 'active' || med.status === 'on-hold');
  }
  
  get inactiveMedications(): Medication[] {
    return this.medications.filter(med => med.status === 'completed' || med.status === 'stopped');
  }
  
  get displayedMedications(): Medication[] {
    if (this.showAll) {
      return this.medications;
    } else {
      return this.activeMedications;
    }
  }
  
  toggleShowAll(): void {
    this.showAll = !this.showAll;
  }
  
  getStatusClass(status: string): string {
    switch(status) {
      case 'active':
        return 'bg-success/10 text-success';
      case 'on-hold':
        return 'bg-status-warning/10 text-status-warning';
      case 'completed':
        return 'bg-primary/10 text-primary';
      case 'stopped':
        return 'bg-status-urgent/10 text-status-urgent';
      default:
        return 'bg-text/10 text-text';
    }
  }
}