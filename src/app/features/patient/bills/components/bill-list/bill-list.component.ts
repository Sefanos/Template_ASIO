import { ChangeDetectorRef, Component, EventEmitter, OnInit, Output, OnDestroy } from '@angular/core';
import { Bill, PaginatedResponse } from '../../../../../core/patient/domain/models/bill.model';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators'; 
import { BillFilters, BillService } from '../../../../../core/patient/services/bill.service';

@Component({
  selector: 'app-bill-list',
  standalone: false,
  templateUrl: './bill-list.component.html',
  styleUrl: './bill-list.component.css'
})

export class BillListComponent implements OnInit, OnDestroy {
  @Output() billSelected = new EventEmitter<Bill | undefined>();

  billsResponse: PaginatedResponse<Bill> | null = null;
  isLoading = true;
  errorMessage: string | null = null;
  currentSelectedBillId: number | null = null;

  filters: BillFilters = {
    page: 1,
    per_page: 10,
    sort_by: 'issue_date',
    sort_direction: 'desc',
    date_from: '',
    date_to: '',
    status: 'paid' // Par défaut "payée"
  };

  // Colonnes pour l'affichage et le tri. 'doctor_specialty' est pour affichage seulement.
  sortableColumns: { key: 'id' | 'issue_date' | 'amount' | 'status' | 'doctor_name', label: string }[] = [
    { key: 'id', label: "N° Facture" },
    { key: 'issue_date', label: "Date" },
    { key: 'doctor_name', label: "Nom Dr." },
    { key: 'amount', label: 'Montant' },
    { key: 'status', label: 'Statut' },
  ];

  statusOptions: string[] = ['paid', 'pending', 'overdue', 'cancelled'];
  private destroy$ = new Subject<void>();

  constructor(
    private billService: BillService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadBills();
  }

  loadBills(): void {
    this.isLoading = true;
    this.errorMessage = null;
    // Ne pas réinitialiser currentSelectedBillId ici pour garder la sélection active si elle est toujours dans la liste
    // this.billSelected.emit(undefined); // Émettre seulement si la sélection change vraiment

    this.billService.getBills(this.filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.billsResponse = response;
          // Vérifier si la facture actuellement sélectionnée pour détail est toujours dans la nouvelle liste
          if (this.currentSelectedBillId && !response.data.find(b => b.id === this.currentSelectedBillId)) {
            this.currentSelectedBillId = null;
            this.billSelected.emit(undefined); // Désélectionner si elle n'est plus là
          }
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Erreur lors du chargement des factures:', err);
          this.billsResponse = null;
          this.currentSelectedBillId = null; // Désélectionner en cas d'erreur
          this.billSelected.emit(undefined);
          if (err.status === 404) {
            this.errorMessage = 'Aucune facture trouvée pour les critères sélectionnés.';
          } else {
            this.errorMessage = 'Une erreur est survenue lors du chargement des factures.';
          }
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
  }

  applyFilters(): void {
    this.filters.page = 1;
    this.loadBills();
  }

  resetFilters(): void {
    this.filters = {
      page: 1,
      per_page: 10,
      sort_by: 'issue_date',
      sort_direction: 'desc',
      date_from: '',
      date_to: '',
      status: 'paid'
    };
    // Ne pas désélectionner ici, loadBills s'en chargera si besoin
    this.loadBills();
  }

  onSortChange(columnKey: 'id' | 'issue_date' | 'amount' | 'status' | 'doctor_name'): void {
    if (this.filters.sort_by === columnKey) {
      this.filters.sort_direction = this.filters.sort_direction === 'asc' ? 'desc' : 'asc';
    } else {
      this.filters.sort_by = columnKey as BillFilters['sort_by']; // Cast car doctor_name n'est pas dans BillFilters.sort_by
      this.filters.sort_direction = 'desc';
    }
    this.filters.page = 1;
    this.loadBills();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= (this.billsResponse?.last_page || 1) && page !== this.filters.page) {
      this.filters.page = page;
      this.loadBills();
    }
  }

  viewBillDetails(bill: Bill): void {
    if (this.currentSelectedBillId === bill.id) { // Si on clique sur la même facture déjà sélectionnée
      this.currentSelectedBillId = null;
      this.billSelected.emit(undefined); // Désélectionner
    } else {
      this.currentSelectedBillId = bill.id;
      this.billSelected.emit(bill);
    }
  }

  downloadBillPdf(bill: Bill, event: MouseEvent): void {
    event.stopPropagation();
    if (bill.pdf_link) {
      window.open(bill.pdf_link, '_blank');
    } else {
      alert("Aucun PDF disponible pour cette facture.");
    }
  }

  getPaginationArray(): number[] {
    if (!this.billsResponse || this.billsResponse.last_page <= 1) return [];
    const totalPages = this.billsResponse.last_page;
    const currentPage = this.billsResponse.current_page;
    const maxPagesToShow = 5;
    let startPage: number, endPage: number;
    if (totalPages <= maxPagesToShow) {
      startPage = 1; endPage = totalPages;
    } else {
      const maxPagesBeforeCurrentPage = Math.floor(maxPagesToShow / 2);
      const maxPagesAfterCurrentPage = Math.ceil(maxPagesToShow / 2) - 1;
      if (currentPage <= maxPagesBeforeCurrentPage) {
        startPage = 1; endPage = maxPagesToShow;
      } else if (currentPage + maxPagesAfterCurrentPage >= totalPages) {
        startPage = totalPages - maxPagesToShow + 1; endPage = totalPages;
      } else {
        startPage = currentPage - maxPagesBeforeCurrentPage; endPage = currentPage + maxPagesAfterCurrentPage;
      }
    }
    return Array.from(Array((endPage + 1) - startPage).keys()).map(i => startPage + i);
  }

  trackByBillId(index: number, bill: Bill): number {
    return bill.id;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
