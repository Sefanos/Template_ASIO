import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-patient-info-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './patient-info-header.component.html',
  styleUrl: './patient-info-header.component.css'
})
export class PatientInfoHeaderComponent {
  @Input() patientId: number | null = null;
  @Input() name: string = 'Unknown Patient';
  @Input() dob: string = '';
}
