import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-patient-not-found',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './patient-not-found.component.html',
})
export class PatientNotFoundComponent {
  @Output() goBack = new EventEmitter<void>();
  
  onGoBack(): void {
    this.goBack.emit();
  }
}