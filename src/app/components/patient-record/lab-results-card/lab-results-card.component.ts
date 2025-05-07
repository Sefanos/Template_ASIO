import { Component, Input, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {LabResult} from '../../../models/patient-record.model';

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
      console.log('Lab results updated:', this.labResults?.length || 0);
      // Force change detection when lab results change
      setTimeout(() => this.cdr.detectChanges(), 0);
    }
  }
  
  get recentLabResults(): LabResult[] {
    if (!this.labResults || this.labResults.length === 0) {
      return [];
    }
    
    // Group by name and get most recent result for each type
    const groupedResults = this.labResults.reduce((acc, curr) => {
      if (!acc[curr.name] || new Date(curr.date) > new Date(acc[curr.name].date)) {
        acc[curr.name] = curr;
      }
      return acc;
    }, {} as {[key: string]: LabResult});
    
    return Object.values(groupedResults).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    ).slice(0, 5); // Return most recent 5 results
  }
  
  getStatusClass(status: string): string {
    switch(status) {
      case 'normal':
        return 'text-status-success';
      case 'abnormal':
        return 'text-status-warning';
      case 'critical':
        return 'text-status-urgent';
      default:
        return 'text-text';
    }
  }
  
  getTrendIcon(trend?: string): string {
    if (!trend) return '';
    
    switch(trend) {
      case 'up':
        return `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4">
            <path d="m18 9-6-6-6 6"/>
            <path d="M12 3v18"/>
          </svg>
        `;
      case 'down':
        return `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4">
            <path d="m6 15 6 6 6-6"/>
            <path d="M12 3v18"/>
          </svg>
        `;
      case 'stable':
        return `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4">
            <path d="M3 12h18"/>
          </svg>
        `;
      default:
        return '';
    }
  }
  
  getTrendClass(trend?: string): string {
    if (!trend) return '';
    
    switch(trend) {
      case 'up':
        return 'text-status-warning';
      case 'down':
        return 'text-status-info';
      case 'stable':
        return 'text-status-success';
      default:
        return '';
    }
  }
}