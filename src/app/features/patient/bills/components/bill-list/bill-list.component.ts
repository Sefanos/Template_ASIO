import { ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { Bill, PaginatedResponse } from '../../../../../core/patient/domain/models/bill.model';
import { BillFilters, BillService } from '../../../../../core/patient/services/bill.service.ts.service';
 

@Component({
  selector: 'app-bill-list',
  standalone: false,
  templateUrl: './bill-list.component.html',
  styleUrl: './bill-list.component.css'
})
export class BillListComponent implements OnInit, OnChanges {
  @Input() patientId!: string | number;
  @Output() billSelected = new EventEmitter<Bill | undefined>(); // Émettre la facture sélectionnée

  billsResponse: PaginatedResponse<Bill> | null = null;
  isLoading = true;
  errorMessage: string | null = null;
  selectedBillId: number | null = null; // Pour styler la ligne sélectionnée

  filters: BillFilters = {
    page: 1,
    per_page: 10,
    sort_by: 'issue_date', // Par défaut, les plus récentes en premier
    sort_direction: 'desc',
    date_from: '',
    date_to: ''
  };
  sortableColumns: { key: 'issue_date' | 'amount', label: string }[] = [
    { key: 'issue_date', label: "Date d'Émission" },
    { key: 'amount', label: 'Montant' }
  ];

  constructor(
    private billService: BillService,
    private cdr: ChangeDetectorRef
  ) {}
  ngOnInit(): void {
    if (this.patientId) {
      this.loadBills();
    } else {
      this.isLoading = false;
      this.errorMessage = "L'identifiant du patient est requis pour charger les factures.";
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['patientId'] && !changes['patientId'].firstChange && changes['patientId'].currentValue) {
      this.filters.page = 1;
      this.selectedBillId = null; // Réinitialiser la sélection si l'ID patient change
      this.billSelected.emit(undefined); // Émettre undefined pour désélectionner dans le parent
      this.loadBills();
    }
  }
  loadBills(): void {
    if (!this.patientId) {
      this.isLoading = false;
      this.errorMessage = "L'identifiant du patient est manquant pour charger les factures.";
      this.billsResponse = null; // Vider les factures précédentes
      this.selectedBillId = null;
      this.billSelected.emit(undefined);
      this.cdr.detectChanges();
      return;
  }

    this.isLoading = true;
    this.errorMessage = null;
    // Assurez-vous que String(this.patientId) est correct si patientId peut être un nombre
    this.billService.getPaidBills(String(this.patientId), this.filters).subscribe({
      next: (response) => {
        this.billsResponse = response;
        this.isLoading = false;
        // Si une facture était sélectionnée et n'est plus dans la liste, désélectionner
        if (this.selectedBillId && !response.data.find(b => b.id === this.selectedBillId)) {
            this.selectedBillId = null;
            this.billSelected.emit(undefined);
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur lors du chargement des factures:', err);
        this.billsResponse = null;
        this.selectedBillId = null;
        this.billSelected.emit(undefined);
        if (err.status === 404) {
          this.errorMessage = 'Aucune facture payée trouvée pour les critères sélectionnés.';
        } else if (err.status === 401 || err.status === 403) {
          this.errorMessage = 'Vous n\'êtes pas autorisé à voir ces informations.';
        } else {
          this.errorMessage = 'Une erreur est survenue lors du chargement des factures. Veuillez réessayer plus tard.';
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }
  applyFilters(): void {
    this.filters.page = 1;
    // La désélection est gérée dans loadBills si la facture n'est plus visible
    this.loadBills();
  }
  resetFilters(): void {
    this.filters = {
      page: 1,
      per_page: 10,
      sort_by: 'issue_date',
      sort_direction: 'desc',
      date_from: '',
      date_to: ''
    };
    this.loadBills();
  }
  onSortChange(columnKey: 'issue_date' | 'amount'): void {
    if (this.filters.sort_by === columnKey) {
      this.filters.sort_direction = this.filters.sort_direction === 'asc' ? 'desc' : 'asc';
    } else {
      this.filters.sort_by = columnKey;
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
  selectBill(bill: Bill): void {
    // AMÉLIORATION: Gérer la désélection si on clique sur la même facture
    if (this.selectedBillId === bill.id) {
      this.selectedBillId = null;
      this.billSelected.emit(undefined);
    } else {
      this.selectedBillId = bill.id;
      this.billSelected.emit(bill);
    }
  }
  getPaginationArray(): number[] {
    if (!this.billsResponse || this.billsResponse.last_page <= 1) {
      return [];
    }
    const totalPages = this.billsResponse.last_page;
    const currentPage = this.billsResponse.current_page;
    const maxPagesToShow = 5;
    let startPage: number, endPage: number;

    if (totalPages <= maxPagesToShow) {
      startPage = 1;
      endPage = totalPages;
    } else {
      const maxPagesBeforeCurrentPage = Math.floor(maxPagesToShow / 2);
      const maxPagesAfterCurrentPage = Math.ceil(maxPagesToShow / 2) - 1;
      if (currentPage <= maxPagesBeforeCurrentPage) {
        startPage = 1;
        endPage = maxPagesToShow;
      } else if (currentPage + maxPagesAfterCurrentPage >= totalPages) {
        startPage = totalPages - maxPagesToShow + 1;
        endPage = totalPages;
      } else {

        startPage = currentPage - maxPagesBeforeCurrentPage;
        endPage = currentPage + maxPagesAfterCurrentPage;
      }
    }
    return Array.from(Array((endPage + 1) - startPage).keys()).map(i => startPage + i);
  }  

  trackByBillId(index: number, bill: Bill): number {
    return bill.id;
  }
}
