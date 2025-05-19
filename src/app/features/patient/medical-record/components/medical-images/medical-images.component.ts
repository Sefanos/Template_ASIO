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
  selector: 'app-medical-images',
  standalone: false,
  templateUrl: './medical-images.component.html',
  styleUrl: './medical-images.component.css'
})
export class MedicalImagesComponent {
  @Input() records: MedicalRecordItem[] = [];
  @Output() viewRecordDetails = new EventEmitter<MedicalRecordItem>();

  onViewDetails(record: MedicalRecordItem): void {
    this.viewRecordDetails.emit(record);
  }
}