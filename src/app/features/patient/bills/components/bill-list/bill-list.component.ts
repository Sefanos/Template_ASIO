import { ChangeDetectorRef, Component, EventEmitter, OnInit, Output, OnDestroy } from '@angular/core';
import { Bill, FrontendPaginatedResponse } from '../../../../../core/patient/domain/models/bill.model';

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

  billsResponse: FrontendPaginatedResponse<Bill> | null = null;
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
    // status: 'paid' // Status filter removed
  };

  // Adjusted sortable columns
  sortableColumns: { key: BillFilters['sort_by'], label: string }[] = [
    { key: 'bill_number', label: "N° Facture" },// Assuming bill_number is sortable
    { key: 'issue_date', label: "Date" },
    { key: 'doctor_name', label: "Nom Dr." }, // Assuming backend handles doctor.name as doctor_name for sorting
    { key: 'amount', label: 'Montant' },
    // { key: 'status', label: 'Statut' }, // Status column removed
  ];

 // statusOptions: string[] = ['paid', 'pending', 'overdue', 'cancelled']; // Status options removed
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
    
    this.billService.getBills(this.filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.billsResponse = response;
         
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
           this.errorMessage = err.message || 'Une erreur est survenue lors du chargement des factures.';
           if (err.status === 404 || (err.message && err.message.includes('Aucune facture'))) {
            this.errorMessage = 'Aucune facture trouvée pour les critères sélectionnés.';
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
      // status: 'paid' // Status filter removed
    };
 
    this.loadBills();
  }

  onSortChange(columnKey: BillFilters['sort_by']): void {
    if (!columnKey) return; // Should not happen with defined columns
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
    if (this.billsResponse && page >= 1 && page <= this.billsResponse.last_page && page !== this.filters.page) {
      this.filters.page = page;
      this.loadBills();
    }
  }

 viewBillDetails(bill: Bill): void {
    if (this.currentSelectedBillId === bill.id) {
      this.currentSelectedBillId = null;
      this.billSelected.emit(undefined);
    } else {
      this.currentSelectedBillId = bill.id;
      this.billSelected.emit(bill);
    }
  }


downloadBillPdf(bill: Bill, event: MouseEvent): void {
    event.stopPropagation();
    // The bill object from the list might not have pdf_path,
    // but the backend will generate the PDF on the fly for the /receipt endpoint.
    // So, we only need the bill.id.
    if (bill.id) {
      this.billService.downloadPatientBillReceipt(bill.id).subscribe({ // Use the new service method
        next: blob => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Recu-${bill.bill_number || bill.id}.pdf`; // Changed to "Recu-"
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          a.remove();
        },
        error: error => {
          console.error('Erreur de téléchargement du reçu PDF depuis la liste:', error);
          // Check for specific error types if backend provides them
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

  getPaginationArray(): number[] {
    if (!this.billsResponse || !this.billsResponse.last_page || this.billsResponse.last_page <= 1) return [];
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
