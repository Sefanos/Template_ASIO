import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
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
  
  onGoToPatientRecord(id: string): void {
    this.viewPatient.emit(id);
  }
  
  /**
   * Check if a row is expanded
   */
  isRowExpanded(patientId: string): boolean {
    return this.expandedRows.has(+patientId); // Convert string to number
  }
  
  /**
   * Toggle row expansion when clicking anywhere on the row
   */
  onToggleExpansion(patientId: string): void {
    const id = +patientId; // Convert string to number
    if (this.expandedRows.has(id)) {
      this.expandedRows.delete(id);
    } else {
      this.expandedRows.add(id);
    }
    this.toggleExpansion.emit(patientId);
  }
  
  onExportData(): void {
    this.exportData.emit();
  }

  getPatientInitials(name: string): string {
    return name.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  onScheduleAppointment(id: string): void {
    // Navigate to calendar/scheduling page with patient ID
    // You can implement this to navigate to your calendar component
    console.log('Scheduling appointment for patient:', id);
    // Example: this.router.navigate(['/doctor/calendar'], { queryParams: { patientId: id } });
  }
}