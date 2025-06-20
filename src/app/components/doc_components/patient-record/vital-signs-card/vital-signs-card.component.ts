import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VitalSignsModalComponent } from '../vital-signs-modal/vital-signs-modal.component';

// Updated interface to match real API data structure
interface ApiVitalSign {
  id: number;
  bloodPressure: {
    systolic: number;
    diastolic: number;
    reading: string;
  };
  pulseRate: number;
  temperature: {
    value: string;
    unit: string;
    display: string;
  };
  respiratoryRate: number;
  oxygenSaturation: number;
  weight: {
    value: string;
    unit: string;
    display: string;
  };
  height: {
    value: string;
    unit: string;
    display: string;
  };
  notes: string | null;
  recordedAt: string;
  recordedBy: string;
}

// Legacy interface for backward compatibility
interface VitalSign {
  id: number;
  date: string;
  systolic: number;
  diastolic: number;
  pulse: number;
  temperature: number;
  respiratoryRate: number;
  oxygenSaturation: number;
  weight: number;
  height: number;
}

@Component({
  selector: 'app-vital-signs-card',
  standalone: true,
  imports: [CommonModule, VitalSignsModalComponent], // Make sure VitalSignsModalComponent is here
  templateUrl: './vital-signs-card.component.html'
})
export class VitalSignsCardComponent {
  @Input() vitals: any[] = [];
  @Input() patientId: string = '';
  @Output() vitalsUpdated = new EventEmitter<any[]>(); // NEW: Emit when vitals change
  @Output() modalOpened = new EventEmitter<void>(); // NEW: Emit modal open event
  
  // Modal state
  isModalOpen: boolean = false;
  
  get latestVitals(): ApiVitalSign | VitalSign | null {
    if (!this.vitals || this.vitals.length === 0) {
      return null;
    }
    
    // Sort by date and return the most recent
    return [...this.vitals]
      .sort((a, b) => {
        const dateA = new Date(a.recordedAt || a.date).getTime();
        const dateB = new Date(b.recordedAt || b.date).getTime();
        return dateB - dateA;
      })[0];
  }
  
  get displayVitals(): any[] {
    return this.vitals.slice(0, 2); // CHANGED: Show only 2 recent readings instead of 5
  }
  
  // NEW: Get recent readings for timeline (only 2)
  get recentReadings(): any[] {
    if (this.vitals.length <= 1) return [];
    return this.vitals.slice(1, 3); // Show 2nd and 3rd readings
  }
  
  // NEW: Open modal method - FIXED
  openVitalSignsModal(): void {
    this.isModalOpen = true; // Set modal state to open
    this.modalOpened.emit(); // Also emit event if needed
  }
  
  // Modal control methods - FIXED
  closeModal(): void {
    this.isModalOpen = false;
  }
  
  // NEW: CRUD event handlers
  onVitalAdded(newVital: any): void {
    this.vitals = [newVital, ...this.vitals];
    this.vitalsUpdated.emit(this.vitals);
    console.log('New vital signs added:', newVital);
  }
  
  onVitalUpdated(updatedVital: any): void {
    const index = this.vitals.findIndex(v => v.id === updatedVital.id);
    if (index !== -1) {
      this.vitals[index] = updatedVital;
      this.vitalsUpdated.emit(this.vitals);
      console.log('Vital signs updated:', updatedVital);
    }
  }
  
  onVitalDeleted(vitalId: number): void {
    this.vitals = this.vitals.filter(v => v.id !== vitalId);
    this.vitalsUpdated.emit(this.vitals);
    console.log('Vital signs deleted:', vitalId);
  }
  
  // Helper method to get systolic BP from either format
  getSystolic(vital: any): number {
    return vital.bloodPressure?.systolic || vital.systolic || 0;
  }
  
  // Helper method to get diastolic BP from either format
  getDiastolic(vital: any): number {
    return vital.bloodPressure?.diastolic || vital.diastolic || 0;
  }
  
  // Helper method to get pulse from either format
  getPulse(vital: any): number {
    return vital.pulseRate || vital.pulse || 0;
  }
  
  // Helper method to get temperature from either format
  getTemperature(vital: any): number {
    return parseFloat(vital.temperature?.value) || vital.temperature || 0;
  }
  
  // Helper method to get temperature display
  getTemperatureDisplay(vital: any): string {
    return vital.temperature?.display || `${vital.temperature}°C` || 'N/A';
  }
  
  // Helper method to get weight display
  getWeightDisplay(vital: any): string {
    return vital.weight?.display || `${vital.weight} kg` || 'N/A';
  }
  
  // Helper method to get height display
  getHeightDisplay(vital: any): string {
    return vital.height?.display || `${vital.height} cm` || 'N/A';
  }
  
  // Helper method to get recorded date
  getRecordedDate(vital: any): string {
    return vital.recordedAt || vital.date || '';
  }
  
  // Helper method to get recorded by
  getRecordedBy(vital: any): string {
    return vital.recordedBy || 'Unknown';
  }
  
  getBPStatus(systolic: number, diastolic: number): string {
    if (systolic >= 180 || diastolic >= 120) {
      return 'crisis';
    } else if (systolic >= 140 || diastolic >= 90) {
      return 'high';
    } else if (systolic >= 130 || diastolic >= 80) {
      return 'elevated';
    } else if (systolic >= 90 && diastolic >= 60) {
      return 'normal';
    } else {
      return 'low';
    }
  }
  
  getBPStatusColor(status: string): string {
    switch (status) {
      case 'crisis': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'elevated': return 'text-yellow-600 bg-yellow-100';
      case 'normal': return 'text-green-600 bg-green-100';
      case 'low': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }
  
  getTemperatureStatus(temp: number): string {
    if (temp >= 38.0) {
      return 'high';
    } else if (temp <= 35.5) {
      return 'low';
    } else {
      return 'normal';
    }
  }
  
  getTemperatureStatusColor(status: string): string {
    switch (status) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'low': return 'text-blue-600 bg-blue-100';
      case 'normal': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }
  
  getO2SatStatus(o2sat: number): string {
    if (o2sat < 90) {
      return 'low';
    } else if (o2sat < 95) {
      return 'borderline';
    } else {
      return 'normal';
    }
  }
  
  getO2SatStatusColor(status: string): string {
    switch (status) {
      case 'low': return 'text-red-600 bg-red-100';
      case 'borderline': return 'text-yellow-600 bg-yellow-100';
      case 'normal': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }
}