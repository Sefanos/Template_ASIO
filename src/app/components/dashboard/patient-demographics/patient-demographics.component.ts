import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-patient-demographics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './patient-demographics.component.html',
  styleUrls: ['./patient-demographics.component.css']
})
export class PatientDemographicsComponent {
  // Properties for dynamic data could be added here
  totalPatients: number = 1248;
  womenPercentage: number = 40;
  menPercentage: number = 60;
  womenCount: number = 499;
  menCount: number = 749;
}
