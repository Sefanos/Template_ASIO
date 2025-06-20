import { Component, Input, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';

// Updated interface to match real API data structure
interface ApiLabResult {
  id: number;
  testName: string;
  result: string;
  units: string;
  referenceRange: string;
  status: string;
  orderedDate: string;
  resultDate: string;
  orderedBy: string;
  lab: string;
  isAbnormal: boolean;
}

// Legacy interface for backward compatibility
interface LabResult {
  id: number;
  name: string;
  value: string;
  unit: string;
  status: 'normal' | 'abnormal' | 'critical' | 'pending';
  date: string;
  notes?: string;
}

@Component({
  selector: 'app-lab-results-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lab-results-card.component.html',
})
export class LabResultsCardComponent implements OnChanges {
  @Input() labResults: any[] = []; // Accept both old and new format
  
  constructor(private cdr: ChangeDetectorRef) {}
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['labResults']) {
      console.log('Lab results updated:', this.labResults?.length || 0);
      // Force change detection when lab results change
      setTimeout(() => this.cdr.detectChanges(), 0);
    }
  }
  
  get displayLabResults(): any[] {
    return this.labResults.slice(0, 5); // Show latest 5 results
  }
  
  get hasLabResults(): boolean {
    return this.labResults && this.labResults.length > 0;
  }
  
  // Helper methods for lab result data
  getTestName(result: any): string {
    return result.testName || result.name || 'Unknown Test';
  }
  
  getResult(result: any): string {
    return result.result || result.value || 'N/A';
  }
  
  getUnits(result: any): string {
    return result.units || result.unit || '';
  }
  
  getReferenceRange(result: any): string {
    return result.referenceRange || result.normalRange || 'N/A';
  }
  
  getStatus(result: any): string {
    if (result.isAbnormal) return 'abnormal';
    return result.status || 'normal';
  }
  
  getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'abnormal': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'normal': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }
  
  getStatusIcon(status: string): string {
    switch (status.toLowerCase()) {
      case 'critical': return '⚠️';
      case 'abnormal': return '⚡';
      case 'normal': return '✅';
      case 'pending': return '⏳';
      default: return '📋';
    }
  }
  
  getOrderedDate(result: any): string {
    return result.orderedDate || result.date || '';
  }
  
  getResultDate(result: any): string {
    return result.resultDate || result.date || '';
  }
  
  getOrderedBy(result: any): string {
    return result.orderedBy || result.doctor || 'Unknown Doctor';
  }
  
  getLab(result: any): string {
    return result.lab || result.laboratory || 'Unknown Lab';
  }
  
  isRecentResult(result: any): boolean {
    const resultDate = new Date(this.getResultDate(result));
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return resultDate > thirtyDaysAgo;
  }
  
  getCriticalResultsCount(): number {
    return this.labResults.filter(result => 
      this.getStatus(result).toLowerCase() === 'critical'
    ).length;
  }
  
  getAbnormalResultsCount(): number {
    return this.labResults.filter(result => 
      this.getStatus(result).toLowerCase() === 'abnormal' || 
      this.getStatus(result).toLowerCase() === 'critical'
    ).length;
  }
}
