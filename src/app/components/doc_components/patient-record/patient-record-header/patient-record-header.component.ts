import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-patient-record-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './patient-record-header.component.html',
})
export class PatientRecordHeaderComponent {
  @Output() goBack = new EventEmitter<void>();
  @Output() togglePrintOptions = new EventEmitter<void>();

  onGoBack(): void {
    this.goBack.emit();
  }

  onTogglePrintOptions(): void {
    this.togglePrintOptions.emit();
  }

}