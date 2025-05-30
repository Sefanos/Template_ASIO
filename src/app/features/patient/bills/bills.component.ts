import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Bill } from '../../../core/patient/domain/models/bill.model';
import { BillService } from '../../../core/patient/services/bill.service';
import { Subject} from 'rxjs';
import { takeUntil } from 'rxjs/operators';

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
    // Pour les stats, on récupère les factures payées.
    // Idéalement, un endpoint backend dédié aux statistiques serait mieux.
    this.billService.getBills({ per_page: 1000, status: 'paid' }) // Récupère un grand nombre de factures payées
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: { data: Bill[] }) => {
          this.allBillsForSummary = response.data;
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
    const paidBills = this.allBillsForSummary;

    const totalCount = paidBills.length;
    const totalAmount = paidBills.reduce((sum, bill) => sum + bill.amount, 0);

    let latestBillDate = 'N/A';
    if (paidBills.length > 0) {
      const sortedBills = [...paidBills].sort((a, b) => new Date(b.issue_date).getTime() - new Date(a.issue_date).getTime());
      if (sortedBills[0]?.issue_date) {
        latestBillDate = new Date(sortedBills[0].issue_date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
      }
    }

    this.summaryCards = [
      { title: 'Total des factures', value: totalCount, icon: 'receipt_long', colorClass: 'bg-blue-100 text-blue-600' },
      { title: 'Montant total', value: `${totalAmount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`, icon: 'payments', colorClass: 'bg-green-100 text-green-600' },
      { title: 'Dernière facture', value: latestBillDate, icon: 'event_note', colorClass: 'bg-orange-100 text-orange-600' },
    ];
  }

  setDefaultSummaryCardsOnError(): void {
    this.summaryCards = [
      { title: 'Total des factures', value: 'N/A', icon: 'receipt_long', colorClass: 'bg-blue-100 text-blue-600' },
      { title: 'Montant total', value: 'N/A', icon: 'payments', colorClass: 'bg-green-100 text-green-600' },
      { title: 'Dernière facture', value: 'N/A', icon: 'event_note', colorClass: 'bg-orange-100 text-orange-600' },
    ];
     }

  onBillSelectedForDetail(bill: Bill | undefined): void {
    this.selectedBill = bill;
    this.cdr.detectChanges();
    if (bill) {
      const detailElement = document.getElementById('billDetailSection');
      detailElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

}
