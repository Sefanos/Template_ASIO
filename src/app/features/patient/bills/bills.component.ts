import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Bill, FrontendPaginatedResponse } from '../../../core/patient/domain/models/bill.model';
import { BillService } from '../../../core/patient/services/bill.service';
import { Subject } from 'rxjs';
import { takeUntil, map, finalize } from 'rxjs/operators';

interface SummaryCard {
  title: string;
  value: string | number;
  icon: string;
  colorClass: string;
}
@Component({
  selector: 'app-bills',
  standalone: false,
  templateUrl: './bills.component.html',
  styleUrl: './bills.component.css'
})
export class BillsComponent implements OnInit, OnDestroy {
   summaryCards: SummaryCard[] = [];
  selectedBill: Bill | undefined = undefined;
  isLoadingSummary = true;
 isLoadingDetail = false; // Ajout pour gérer le chargement du détail

  private allBillsForSummary: Bill[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    private billService: BillService,
    private cdr: ChangeDetectorRef
  ) {}

ngOnInit(): void {
    this.loadAllBillsForSummary();
  }

  loadAllBillsForSummary(): void {
    this.isLoadingSummary = true;
    // Pour les stats, on récupère toutes les factures du patient.
    // Le filtrage par 'paid' n'est plus appliqué ici car l'API /patient/bills
    // ne semble plus supporter le filtre de statut.
    // Si un endpoint dédié aux statistiques existe ou si le filtrage est possible, ajustez ici.
    this.billService.getBills({ per_page: 1000 }) // Récupère un grand nombre de factures
      .pipe(
        takeUntil(this.destroy$),
        map((response: FrontendPaginatedResponse<Bill>) => response.data) // Extrait les données de la réponse paginée
      )
      .subscribe({
        next: (bills: Bill[]) => {
          this.allBillsForSummary = bills;
          this.calculateSummaryCards();
          this.isLoadingSummary = false;
          this.cdr.detectChanges();
        },

        error: (err) => {
          console.error("Erreur lors du chargement des factures pour le résumé:", err);
          this.isLoadingSummary = false;
          this.setDefaultSummaryCardsOnError();
          this.cdr.detectChanges();
        }
      });
  }
   calculateSummaryCards(): void {
    // Le résumé est maintenant calculé sur toutes les factures récupérées,
    // car le statut 'paid' n'est plus un critère de filtrage direct à ce niveau.
    // Vous pourriez vouloir filtrer `this.allBillsForSummary` ici si le statut
    // est disponible dans l'objet Bill (actuellement retiré du modèle).
    const billsToSummarize = this.allBillsForSummary;

    const totalCount = billsToSummarize.length;
    const totalAmount = billsToSummarize.reduce((sum, bill) => sum + bill.amount, 0);

    let latestBillDate = 'N/A';
    if (billsToSummarize.length > 0) {
      const sortedBills = [...billsToSummarize].sort((a, b) => {
        const dateA = new Date(a.issue_date).getTime();
        const dateB = new Date(b.issue_date).getTime();
        return dateB - dateA;
      });
      if (sortedBills[0]?.issue_date) {
        latestBillDate = new Date(sortedBills[0].issue_date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
      }
    }
this.summaryCards = [
      { title: 'Total des factures', value: totalCount, icon: 'receipt_long', colorClass: 'bg-blue-100 text-blue-600' },
      { title: 'Montant total facturé', value: `${totalAmount.toLocaleString('fr-FR', { style: 'currency', currency: 'MAD' })}`, icon: 'payments', colorClass: 'bg-green-100 text-green-600' },
      { title: 'Dernière facture émise', value: latestBillDate, icon: 'event_note', colorClass: 'bg-orange-100 text-orange-600' },
    ];
  }


 setDefaultSummaryCardsOnError(): void {
    this.summaryCards = [
      { title: 'Total des factures', value: 'N/A', icon: 'receipt_long', colorClass: 'bg-blue-100 text-blue-600' },
      { title: 'Montant total facturé', value: 'N/A', icon: 'payments', colorClass: 'bg-green-100 text-green-600' },
      { title: 'Dernière facture émise', value: 'N/A', icon: 'event_note', colorClass: 'bg-orange-100 text-orange-600' },
    ];
  }

   onBillSelectedForDetail(bill: Bill | undefined): void {
    if (bill && bill.id) {
      this.isLoadingDetail = true;
      this.selectedBill = undefined; // Optionnel: réinitialiser pour montrer un chargement
      this.billService.getBillDetails(bill.id)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => {
            this.isLoadingDetail = false;
            this.cdr.detectChanges();
            if (this.selectedBill) { // S'assurer que selectedBill est défini avant de scroller
              const detailElement = document.getElementById('billDetailSection');
              detailElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          })
        )
        .subscribe({
          next: (detailedBill) => {
            this.selectedBill = detailedBill as Bill;
          },
          error: (err) => {
            console.error('Erreur lors du chargement des détails de la facture:', err);
            // Gérer l'erreur, par exemple afficher un message à l'utilisateur
            this.selectedBill = undefined; // Ou garder l'ancien `bill` partiel si préférable
          }
        });
    } else {
      this.selectedBill = undefined;
      this.isLoadingDetail = false; // S'assurer que isLoadingDetail est réinitialisé
      this.cdr.detectChanges();
    }
  } 

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

}
