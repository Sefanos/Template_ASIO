import { Component, EventEmitter, Input, Output } from '@angular/core';
// Interface typically would be in a shared models file
export interface MedicalRecordItem {
  id: string;
  type: 'LabResult' | 'Image' | 'Prescription';
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
}


@Component({
  selector: 'app-lab-results',
  standalone: false,
  templateUrl: './lab-results.component.html',
  styleUrl: './lab-results.component.css'
})
export class LabResultsComponent   {
  @Input() records: MedicalRecordItem[] = [];
  @Output() viewRecordDetails = new EventEmitter<MedicalRecordItem>();

  onViewDetails(record: MedicalRecordItem): void {
    this.viewRecordDetails.emit(record);
  }

  // Optionnel: trackBy pour optimiser le *ngFor
  trackByRecordId(index: number, record: MedicalRecordItem): string {
    return record.id;
  }
}
