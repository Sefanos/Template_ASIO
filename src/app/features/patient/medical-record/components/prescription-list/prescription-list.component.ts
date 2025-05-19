import { Component, EventEmitter, Input, Output } from '@angular/core';

// Interface typically would be in a shared models file
export interface MedicalRecordItem {
  id: string;
  type:  'LabResult' | 'Image' | 'Prescription';
  title: string;
  recordDate: string;
  doctor?: string;
  summary: string;
  details: string;
  tagText: string;
  tagClass: string;
  resultDate?: string;
  performedBy?: string;
  imageDetails?: string;
  takenBy?: string;
  imageUrl?: string;
  status?: 'active' | 'completed';
}

@Component({
  selector: 'app-prescription-list',
  standalone: false,
  templateUrl: './prescription-list.component.html',
  styleUrl: './prescription-list.component.css'
})
export class PrescriptionListComponent {
  @Input() records: MedicalRecordItem[] = [];
  @Output() viewRecordDetails = new EventEmitter<MedicalRecordItem>();
  showAllPrescriptions: boolean = false;

  get displayedRecords(): MedicalRecordItem[] {
    const prescriptionRecords = this.records.filter(record => record.type === 'Prescription');
    if (this.showAllPrescriptions) {
      return prescriptionRecords;
    }
    return prescriptionRecords.filter(record => record.status === 'active');
  }

  get totalPrescriptionCount(): number {
    return this.records.filter(record => record.type === 'Prescription').length;
  }

  get activePrescriptionCount(): number {
    return this.records.filter(record => record.type === 'Prescription' && record.status === 'active').length;
  }

  toggleShowAllPrescriptions(): void {
    this.showAllPrescriptions = !this.showAllPrescriptions;
  }

  onViewDetails(record: MedicalRecordItem): void {
    this.viewRecordDetails.emit(record);
  }
  trackByRecordId(index: number, record: MedicalRecordItem): string {
    return record.id;
  }
}