import { Component } from '@angular/core';

@Component({
  selector: 'app-lab-results',
  standalone: false,
  templateUrl: './lab-results.component.html',
  styleUrl: './lab-results.component.css'
})
export class LabResultsComponent {
  labResults = [
    { test: 'Analyse sanguine', result: 'Normal', date: '2025-04-18' },
    { test: 'Cholestérol', result: 'Élevé', date: '2025-04-15' }
  ];
}
