import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LabResult, LabParameter } from '../../../../../models/lab-result.model';
import { LabResultRowComponent } from '../lab-result-row/lab-result-row.component';
import { LabResultService } from '../../../../../services/doc-services/lab-result.service';

@Component({
  selector: 'app-lab-results-table',
  standalone: true,
  imports: [CommonModule, LabResultRowComponent],
  templateUrl: './lab-results-table.component.html',
  styleUrls: ['./lab-results-table.component.css']
})
export class LabResultsTableComponent implements OnInit, OnChanges {
  @Input() labResults: LabResult[] = [];
  @Input() loading = false;
  
  @Output() labResultUpdated = new EventEmitter<LabResult>();
  @Output() labResultDeleted = new EventEmitter<number>();
  @Output() viewTrend = new EventEmitter<string>();

  // ✅ Table state
  sortColumn: string = 'result_date';
  sortDirection: 'asc' | 'desc' = 'desc';
  expandedRows: Set<number> = new Set();

  constructor(private labResultService: LabResultService) {}

  ngOnInit(): void {
    this.sortLabResults();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['labResults']) {
      this.sortLabResults();
    }
  }

  // ✅ Sorting functionality
  sort(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.sortLabResults();
  }

  private sortLabResults(): void {
    this.labResults.sort((a, b) => {
      let valueA: any;
      let valueB: any;

      switch (this.sortColumn) {
        case 'testName':
          valueA = (a.testName || 'Unknown').toLowerCase();
          valueB = (b.testName || 'Unknown').toLowerCase();
          break;
        case 'result_date':
          valueA = new Date(a.result_date);
          valueB = new Date(b.result_date);
          break;
        case 'status':
          valueA = a.status;
          valueB = b.status;
          break;
        default:
          return 0;
      }

      if (valueA < valueB) {
        return this.sortDirection === 'asc' ? -1 : 1;
      }
      if (valueA > valueB) {
        return this.sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  // ✅ Row expansion
  toggleRowExpansion(resultId: number): void {
    if (this.expandedRows.has(resultId)) {
      this.expandedRows.delete(resultId);
    } else {
      this.expandedRows.add(resultId);
    }
  }

  isRowExpanded(resultId: number): boolean {
    return this.expandedRows.has(resultId);
  }

  // ✅ Event handlers
  onLabResultUpdated(result: LabResult): void {
    this.labResultUpdated.emit(result);
  }

  onLabResultDeleted(resultId: number): void {
    this.labResultService.deleteLabResult(resultId).subscribe({
      next: (success) => {
        if (success) {
          this.expandedRows.delete(resultId);
          this.labResultDeleted.emit(resultId);
        }
      },
      error: (error) => {
        console.error('Error deleting lab result:', error);
        // Show error notification
      }
    });
  }

  onViewTrend(parameterName: string): void {
    this.viewTrend.emit(parameterName);
  }

  // ✅ Utility methods
  getSortIcon(column: string): string {
    if (this.sortColumn !== column) {
      return 'M7 10l5 5 5-5z'; // Default sort icon
    }
    return this.sortDirection === 'asc' 
      ? 'M7 14l5-5 5 5z' // Up arrow
      : 'M7 10l5 5 5-5z'; // Down arrow
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }
  getAbnormalParameterCount(result: LabResult): number {
    const parameters = result.structured_results?.results || [];
    return parameters.filter(param => param.status !== 'normal').length;
  }

  getTotalParameterCount(result: LabResult): number {
    return result.structured_results?.results?.length || 0;
  }

  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid Date';
    }
  }

  formatStatusLabel(status: string): string {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'pending':
        return 'Pending';
      case 'cancelled':
        return 'Cancelled';
      case 'in_progress':
        return 'In Progress';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  }

  // ✅ Track by function for performance
  trackByLabResultId(index: number, result: LabResult): number {
    return result.id;
  }
}