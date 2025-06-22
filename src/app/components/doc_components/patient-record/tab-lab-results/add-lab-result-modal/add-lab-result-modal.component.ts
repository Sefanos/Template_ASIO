import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LabResult } from '../../../../../models/lab-result.model';

@Component({
  selector: 'app-add-lab-result-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './add-lab-result-modal.component.html',
  styleUrls: ['./add-lab-result-modal.component.css'],
})
export class AddLabResultModalComponent {
  @Input() patientId!: number;
  
  @Output() labResultAdded = new EventEmitter<LabResult>();
  @Output() cancelled = new EventEmitter<void>();

  onCancel(): void {
    this.cancelled.emit();
  }
}