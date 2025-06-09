import { Component, Input } from '@angular/core';
import { Bill } from '../../../../../core/patient/domain/models/bill.model';
import { BillService } from '../../../../../core/patient/services/bill.service';
 
 
@Component({
  selector: 'app-bill-detail',
  standalone: false,
  templateUrl: './bill-detail.component.html',
  styleUrl: './bill-detail.component.css'
})
export class BillDetailComponent {
@Input() bill: Bill | undefined = undefined;

  constructor(private billService: BillService) { } // Inject BillService

  downloadPdfFromDetail(): void {
    // The bill object in detail view might have pdf_path, but for consistency and
    // to ensure the latest version is always fetched from the /receipt endpoint,
    // we'll use the bill ID.
    if (this.bill && this.bill.id) {
      this.billService.downloadPatientBillReceipt(this.bill.id).subscribe({ // Use the new service method
        next: blob => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Recu-${this.bill?.bill_number || this.bill?.id}.pdf`; // Changed to "Recu-"
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          a.remove();
        },
         error: error => {
          console.error('Erreur de téléchargement du reçu PDF depuis détail:', error);
          let errorMessage = "Erreur lors du téléchargement du PDF.";
          if (error.status === 403) {
            errorMessage = "Vous n'êtes pas autorisé à télécharger ce reçu.";
          } else if (error.status === 404) {
            errorMessage = "Reçu non trouvé.";
          }
          alert(errorMessage);
        }
      });
    } else {
      alert("ID de facture manquant, impossible de télécharger le PDF.");
    }
  }
}
