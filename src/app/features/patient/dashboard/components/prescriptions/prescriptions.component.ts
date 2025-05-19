import { Component } from '@angular/core';

@Component({
  selector: 'app-prescriptions',
  standalone: false,
  templateUrl: './prescriptions.component.html',
  styleUrl: './prescriptions.component.css'
})
export class PrescriptionsComponent {
  prescriptions = [
    { medication: 'Paracétamol', dosage: '500mg', frequency: '2 fois par jour' },
    { medication: 'Ibuprofène', dosage: '200mg', frequency: '1 fois par jour' }
  ];
}
