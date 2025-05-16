import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Patient } from '../../../../models/patient.model';

// Interface for the transformed patient data displayed in the table
export interface PatientTableRow {
  id: number;
  name: string;
  lastVisit: string;
  status: string;
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
  @Input() pageSize: number = 8;
  @Input() totalPages: number = 1;
  @Input() pagesToShow: (number | string)[] = [];
  @Input() isLoading: boolean = false;
  
  @Output() pageChange = new EventEmitter<number>();
  @Output() viewPatient = new EventEmitter<number>();
  @Output() messagePatient = new EventEmitter<number>();
  @Output() exportData = new EventEmitter<void>();
  
  changePage(page: number): void {
    this.pageChange.emit(page);
  }
  
  onViewPatient(id: number, event: Event): void {
    event.stopPropagation();
    this.viewPatient.emit(id);
  }
  
  onMessagePatient(id: number, event: Event): void {
    event.stopPropagation();
    this.messagePatient.emit(id);
  }
  
  onGoToPatientRecord(id: number): void {
    this.viewPatient.emit(id);
  }
  
  onExportData(): void {
    this.exportData.emit();
  }
}