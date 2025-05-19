import { Component, OnInit } from '@angular/core';
import { Bill } from '../../../core/patient/domain/models/bill.model';
 
@Component({
  selector: 'app-bills',
  standalone: false,
  templateUrl: './bills.component.html',
  styleUrl: './bills.component.css'
})
export class BillsComponent implements OnInit{
  patientId: string | number | null = null;
  // selectedBill: Bill | undefined = undefined; // Pour stocker la facture sélectionnée

  // constructor(private authService: AuthService) {} // Exemple

  ngOnInit(): void {
    // this.patientId = this.authService.getCurrentPatientId();
    this.patientId = 1; // REMPLACEZ PAR LA LOGIQUE RÉELLE D'AUTH
    if (!this.patientId) {
      console.error("ID du patient non disponible.");
    }
  }

  // onBillSelected(bill: Bill | undefined): void {
  //   this.selectedBill = bill;
  // }
}
