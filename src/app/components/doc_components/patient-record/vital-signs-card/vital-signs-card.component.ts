import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

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
  imports: [CommonModule],
  templateUrl: './vital-signs-card.component.html',
})
export class VitalSignsCardComponent {
  @Input() vitals: VitalSign[] = [];
  
  get latestVitals(): VitalSign | null {
    if (!this.vitals || this.vitals.length === 0) {
      return null;
    }
    
    // Sort by date and return the most recent
    return [...this.vitals]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
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
  
  getTemperatureStatus(temp: number): string {
    if (temp >= 38.0) {
      return 'high';
    } else if (temp <= 35.5) {
      return 'low';
    } else {
      return 'normal';
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
}