import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LabResult, LabParameter } from '../../../../../models/lab-result.model';

@Component({
  selector: 'app-lab-result-row',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lab-result-row.component.html',
  styleUrls: ['./lab-result-row.component.css']
})
export class LabResultRowComponent {
  @Input() labResult!: LabResult;
  
  @Output() labResultUpdated = new EventEmitter<LabResult>();
  @Output() labResultDeleted = new EventEmitter<number>();
  @Output() viewTrend = new EventEmitter<string>();

  // ✅ Component state
  showDeleteConfirmation = false;
  isDeleting = false;

  // ✅ Get parameter status styling
  getParameterStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'normal':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'borderline':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'critical':
        return 'bg-red-200 text-red-900 border-red-300 font-semibold';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  // ✅ Get parameter status icon
  getParameterStatusIcon(status: string): string {
    switch (status.toLowerCase()) {
      case 'normal':
        return 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'; // Check circle
      case 'high':
        return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'; // Exclamation
      case 'low':
        return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'; // Exclamation
      case 'borderline':
        return 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z'; // Warning
      case 'critical':
        return 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'; // Alert circle
      default:
        return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
    }
  }

  // ✅ Format parameter status label
  formatParameterStatus(status: string): string {
    switch (status.toLowerCase()) {
      case 'normal':
        return 'Normal';
      case 'high':
        return 'High';
      case 'low':
        return 'Low';
      case 'borderline':
        return 'Borderline';
      case 'critical':
        return 'CRITICAL';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  }

  // ✅ Check if parameter is abnormal
  isParameterAbnormal(status: string): boolean {
    return !['normal'].includes(status.toLowerCase());
  }

  // ✅ View trend for specific parameter
  onViewParameterTrend(parameter: LabParameter): void {
    const parameterName = parameter.name || parameter.parameter || '';
    if (parameterName) {
      this.viewTrend.emit(parameterName);
    }
  }

  // ✅ Edit lab result
  onEditLabResult(): void {
    console.log('Edit lab result:', this.labResult.id);
    // This will be implemented when we add the edit modal
    // For now, just log the action
  }

  // ✅ Delete confirmation
  onDeleteLabResult(): void {
    this.showDeleteConfirmation = true;
  }

  confirmDelete(): void {
    this.isDeleting = true;
    
    // Simulate API call delay
    setTimeout(() => {
      this.labResultDeleted.emit(this.labResult.id);
      this.showDeleteConfirmation = false;
      this.isDeleting = false;
    }, 1000);
  }

  cancelDelete(): void {
    this.showDeleteConfirmation = false;
  }

  // ✅ Format date helper
  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid Date';
    }
  }

  // ✅ Check if parameter has valid numeric value for trending
  canShowTrend(parameter: LabParameter): boolean {
    const value = parseFloat(parameter.value);
    return !isNaN(value) && isFinite(value);
  }
  // ✅ Get overall result status
  getOverallResultStatus(): 'normal' | 'abnormal' | 'critical' {
    const parameters = this.labResult.structured_results?.results || [];
    
    if (parameters.some(p => p.status.toLowerCase() === 'critical')) {
      return 'critical';
    }
    
    if (parameters.some(p => this.isParameterAbnormal(p.status))) {
      return 'abnormal';
    }
    
    return 'normal';
  }

  // ✅ Get result summary text
  getResultSummary(): string {
    const parameters = this.labResult.structured_results?.results || [];
    const totalParams = parameters.length;
    const abnormalParams = parameters.filter(p => 
      this.isParameterAbnormal(p.status)
    ).length;
    
    if (totalParams === 0) {
      return 'No parameters available';
    }
    
    if (abnormalParams === 0) {
      return `All ${totalParams} parameters are within normal range`;
    } else {
      return `${abnormalParams} of ${totalParams} parameters are abnormal`;
    }
  }

  // ✅ Get document name from path
  getDocumentName(documentPath: string): string {
    try {
      return documentPath.split('/').pop() || 'Unknown Document';
    } catch {
      return 'Unknown Document';
    }
  }
}