import { Component, Input, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LabResult } from '../../../../models/lab-result.model';

@Component({
  selector: 'app-lab-results-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lab-results-card.component.html',
})
export class LabResultsCardComponent implements OnChanges {
  @Input() labResults: LabResult[] = [];
  
  constructor(private cdr: ChangeDetectorRef) {}
    ngOnChanges(changes: SimpleChanges): void {
    if (changes['labResults']) {
      console.log('Lab results card - raw data:', this.labResults);
      console.log('Lab results card - count:', this.labResults?.length || 0);
      if (this.labResults?.length > 0) {
        console.log('Lab results card - first result:', this.labResults[0]);
      }
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
  getTestName(result: LabResult): string {
    return result.testName || result.testCode || `Lab Test #${result.id}`;
  }
  
  getResult(result: LabResult): string {
    // Get the first parameter value or a summary
    const parameters = result.structured_results?.results || [];
    if (parameters.length === 0) return 'No results';
    if (parameters.length === 1) {
      return `${parameters[0].value} ${parameters[0].unit || ''}`.trim();
    }
    return `${parameters.length} parameters`;
  }
  
  getUnits(result: LabResult): string {
    const parameters = result.structured_results?.results || [];
    if (parameters.length === 1) {
      return parameters[0].unit || '';
    }
    return '';
  }
  
  getReferenceRange(result: LabResult): string {
    const parameters = result.structured_results?.results || [];
    if (parameters.length === 1) {
      return parameters[0].reference_range || parameters[0].referenceRange || 'N/A';
    }
    return 'Multiple ranges';
  }
  
  getStatus(result: LabResult): string {
    // Check if any parameters are abnormal
    const parameters = result.structured_results?.results || [];
    const hasAbnormal = parameters.some(p => p.status !== 'normal');
    const hasCritical = parameters.some(p => p.status === 'critical');
    
    if (hasCritical) return 'critical';
    if (hasAbnormal) return 'abnormal';
    return 'normal';
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
    getOrderedDate(result: LabResult): string {
    return result.created_at || result.result_date || '';
  }
  
  getResultDate(result: LabResult): string {
    return result.result_date || result.created_at || '';
  }
  
  getOrderedBy(result: LabResult): string {
    return result.reviewedBy || `Doctor ID: ${result.reviewed_by_user_id}` || 'Unknown Doctor';
  }
  
  getLab(result: LabResult): string {
    return result.labName || result.performed_by_lab_name || 'Lab';
  }
  
  isRecentResult(result: LabResult): boolean {
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
    return this.labResults.filter(result => {
      const status = this.getStatus(result).toLowerCase();
      return status === 'abnormal' || status === 'critical';
    }).length;
  }
}
