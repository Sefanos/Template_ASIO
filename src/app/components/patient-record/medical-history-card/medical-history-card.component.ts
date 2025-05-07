import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

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
  @Input() conditions: Condition[] = [];
  
  showAll: boolean = false;
  
  get activeConditions(): Condition[] {
    return this.conditions.filter(condition => 
      condition.status === 'active' || condition.status === 'chronic' || condition.status === 'recurrent'
    );
  }
  
  get resolvedConditions(): Condition[] {
    return this.conditions.filter(condition => condition.status === 'resolved');
  }
  
  get displayedConditions(): Condition[] {
    if (this.showAll) {
      return this.conditions;
    } else {
      return this.activeConditions;
    }
  }
  
  toggleShowAll(): void {
    this.showAll = !this.showAll;
  }
  
  getStatusClass(status: string): string {
    switch(status) {
      case 'active':
        return 'bg-status-urgent/10 text-status-urgent';
      case 'resolved':
        return 'bg-success/10 text-success';
      case 'recurrent':
        return 'bg-status-warning/10 text-status-warning';
      case 'chronic':
        return 'bg-primary/10 text-primary';
      default:
        return 'bg-text/10 text-text';
    }
  }
  
  /**
   * Converts a European date format (DD/MM/YYYY) to a JavaScript Date object
   * @param dateString Date string in DD/MM/YYYY format or Date object
   * @returns JavaScript Date object or null if invalid
   */
  parseDate(dateString: string | Date): Date | null {
    if (!dateString) return null;
    
    // Check if it's already a Date object
    if (dateString instanceof Date) return dateString;
    
    // Parse DD/MM/YYYY format
    const parts = dateString.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // JavaScript months are 0-based
      const year = parseInt(parts[2], 10);
      
      // Create a date object
      const date = new Date(year, month, day);
      
      // Validate the date is correct
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    
    // Try alternative formats (YYYY/MM/DD or MM/DD/YYYY)
    try {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date;
      }
    } catch (e) {
      console.warn(`Could not parse date: ${dateString}`);
    }
    
    return null;
  }
  
  /**
   * Format a date for display in case Date pipe fails
   * @param dateString Date string
   * @returns Formatted date string
   */
  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    
    const date = this.parseDate(dateString);
    if (date) {
      // Return formatted date
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
    
    // Return original string if parsing fails
    return dateString;
  }
}