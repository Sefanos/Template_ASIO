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
    this.billService.getBills({ per_page: 1000 })
      .pipe(
        takeUntil(this.destroy$),
        map((response: FrontendPaginatedResponse<Bill>) => response.data)
      )
      .subscribe({
        next: (bills: Bill[]) => {
          this.allBillsForSummary = bills;
          this.calculateSummaryCards();
          this.isLoadingSummary = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error("Error loading bills for summary:", err);
          this.isLoadingSummary = false;
          this.setDefaultSummaryCardsOnError();
          this.cdr.detectChanges();
        }
      });
  }
  calculateSummaryCards(): void {
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
        latestBillDate = new Date(sortedBills[0].issue_date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
      }
    }
    this.summaryCards = [
      { title: 'Total bills', value: totalCount, icon: 'receipt_long', colorClass: 'bg-blue-100 text-blue-600' },
      { title: 'Total billed amount', value: `${totalAmount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MAD`, icon: 'payments', colorClass: 'bg-green-100 text-green-600' },
      { title: 'Last bill issued', value: latestBillDate, icon: 'event_note', colorClass: 'bg-orange-100 text-orange-600' },
    ];
  }
  setDefaultSummaryCardsOnError(): void {
    this.summaryCards = [
      { title: 'Total bills', value: 'N/A', icon: 'receipt_long', colorClass: 'bg-blue-100 text-blue-600' },
      { title: 'Total billed amount', value: 'N/A', icon: 'payments', colorClass: 'bg-green-100 text-green-600' },
      { title: 'Last bill issued', value: 'N/A', icon: 'event_note', colorClass: 'bg-orange-100 text-orange-600' },
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
