import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Patient } from '../../../../models/patient.model';

// Interface for the transformed patient data displayed in the table
export interface PatientTableRow {
  id: string; // Changed to string for consistency
  name: string;
  email: string;
  phone: string;
  status: string;
  lastVisit: string;
  age: number;
  appointmentsInfo: string;
  hasAlerts?: boolean;
  alertsCount?: number;
  expandedData?: any; // For rich data in expandable rows
}

@Component({
  selector: 'app-patient-list-table',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './patient-list-table.component.html',
  styleUrl: './patient-list-table.component.css'
})
export class PatientListTableComponent {
  @Input() patients: PatientTableRow[] = [];
  @Input() currentPage: number = 1;
  @Input() pageSize: number = 20;
  @Input() totalPages: number = 1;
  @Input() pagesToShow: number[] = [];
  @Input() isLoading: boolean = false;
  @Input() activeTab: 'my-patients' | 'all-patients' = 'my-patients';
  @Input() expandedRows: Set<number> = new Set();
  
  @Output() pageChange = new EventEmitter<number>();
  @Output() viewPatient = new EventEmitter<string>();
  @Output() messagePatient = new EventEmitter<string>();
  @Output() toggleExpansion = new EventEmitter<string>();
  @Output() exportData = new EventEmitter<void>();
  
  constructor(private router: Router) {} // Add Router injection

  changePage(page: number): void {
    this.pageChange.emit(page);
  }
  
  onViewPatient(id: string, event: Event): void {
    event.stopPropagation();
    this.viewPatient.emit(id);
  }
    onMessagePatient(id: string, event: Event): void {
    event.stopPropagation();
    this.messagePatient.emit(id);
  }
    onGoToPatientRecord(id: string, event: Event): void {
    event.stopPropagation(); // Prevent row toggling
    this.viewPatient.emit(id);
  }
  
  /**
   * Check if a row is expanded
   */
  isRowExpanded(patientId: string): boolean {
    return this.expandedRows.has(+patientId); // Convert string to number
  }

  /**
   * Check if medical columns should be shown (for My Patients tab)
   */
  get showMedicalColumns(): boolean {
    return this.activeTab === 'my-patients';
  }

  /**
   * TrackBy function for ngFor to improve performance
   */
  trackByPatientId(index: number, patient: PatientTableRow): string {
    return patient.id;
  }

  /**
   * Toggle row expansion when clicking anywhere on the row
   */
  toggleRowExpansion(patientId: number): void {
    if (this.expandedRows.has(patientId)) {
      this.expandedRows.delete(patientId);
    } else {
      this.expandedRows.add(patientId);
    }
  }

  /**
   * Generate patient initials for avatar
   */
  getPatientInitials(name: string): string {
    return name
      .split(' ')
      .map(n => n.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  onExportData(): void {
    this.exportData.emit();
  }

  /**
   * Navigate to calendar for scheduling appointment
   */
  onScheduleAppointment(patientId: string, event: Event): void {
    event.stopPropagation();
    this.router.navigate(['/doctor/calendar'], { 
      queryParams: { 
        patientId: patientId,
        action: 'schedule'
      } 
    });
  }

  /**
   * Handle row click - toggle expansion (make entire row clickable)
   */
  onRowClick(patient: PatientTableRow, event: Event): void {
    // Don't expand if clicking on action buttons
    const target = event.target as HTMLElement;
    if (target.tagName === 'BUTTON' || target.closest('button')) {
      return;
    }
    
    const patientId = parseInt(patient.id);
    this.toggleRowExpansion(patientId);
  }
}