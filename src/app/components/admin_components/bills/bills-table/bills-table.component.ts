import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { Bill, BillListParams, PaginatedResponse } from '../../../../models/bill-management.model';
import { BillManagementService } from '../../../../services/bill-management.service';

@Component({
  selector: 'app-bills-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bills-table.component.html',
  styleUrl: './bills-table.component.css'
})
export class BillsTableComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  // Data properties
  bills: Bill[] = [];
  filteredBills: Bill[] = [];
  displayedBills: Bill[] = [];
  
  // State properties
  isLoading = false;
  hasError = false;
  errorMessage = '';
  
  // Filter properties
  searchTerm = '';
  fromDate = '';
  toDate = '';
  
  // Sorting properties
  sortBy: keyof Bill | 'patient_name' | 'doctor_name' = 'issue_date';
  sortDirection: 'asc' | 'desc' = 'desc';
  
  // Pagination properties (client-side for search, server-side for data)
  currentPage = 1;
  itemsPerPage = 15;
  totalPages = 0;
  maxPagesToShow = 5;

  // Delete confirmation modal
  showDeleteConfirmation = false;
  billToDelete: Bill | null = null;

  constructor(private billService: BillManagementService) {}

  ngOnInit(): void {
    this.setupSearchDebounce();
    this.loadBills();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearchDebounce(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.applyFilters();
    });
  }

  loadBills(): void {
    this.isLoading = true;
    this.hasError = false;
    
    // Define valid sort fields for the API
    const validSortFields: Array<'doctor_name' | 'patient_name' | 'amount' | 'issue_date' | 'created_at'> =
      ['doctor_name', 'patient_name', 'amount', 'issue_date', 'created_at'];
    
    // Determine the sort field to use
    let sortField: 'doctor_name' | 'patient_name' | 'amount' | 'issue_date' | 'created_at' | undefined;
    
    if (this.sortBy === 'patient_name') {
      sortField = 'patient_name';
    } else if (this.sortBy === 'doctor_name') {
      sortField = 'doctor_name';
    } else if (validSortFields.includes(this.sortBy as any)) {
      sortField = this.sortBy as 'amount' | 'issue_date' | 'created_at';
    } else {
      sortField = 'issue_date'; // Default fallback
    }

    const params: BillListParams = {
      sort_by: sortField,
      sort_order: this.sortDirection,
      per_page: 1000 // Load more for client-side filtering
    };

    // Add date filters to API params (server-side filtering for dates)
    if (this.fromDate) {
      params.from_date = this.fromDate;
    }
    if (this.toDate) {
      params.to_date = this.toDate;
    }

    this.billService.getBills(params).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response: PaginatedResponse<Bill>) => {
        this.bills = response.items || [];
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading bills:', error);
        this.hasError = true;
        this.errorMessage = error.message || 'Failed to load bills';
        this.isLoading = false;
        this.bills = [];
        this.filteredBills = [];
        this.displayedBills = [];
      }
    });
  }

  onSearchInput(): void {
    this.searchSubject.next(this.searchTerm);
  }

  onSearch(): void {
    this.searchSubject.next(this.searchTerm);
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.applyFilters();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.fromDate = '';
    this.toDate = '';
    this.currentPage = 1;
    this.loadBills();
  }

  applyDateFilter(): void {
    this.currentPage = 1;
    this.loadBills();
  }

  private applyFilters(): void {
    let filtered = [...this.bills];

    // Apply versatile search filter (client-side)
    if (this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(bill =>
        // Search in bill number
        bill.bill_number.toLowerCase().includes(searchLower) ||
        // Search in patient name
        this.getPatientName(bill).toLowerCase().includes(searchLower) ||
        // Search in doctor name
        this.getDoctorName(bill).toLowerCase().includes(searchLower) ||
        // Search in payment method
        bill.payment_method.toLowerCase().includes(searchLower) ||
        // Search in amount (convert to string)
        bill.amount.toString().toLowerCase().includes(searchLower) ||
        // Search in description if available
        (bill.description && bill.description.toLowerCase().includes(searchLower))
      );
    }

    this.filteredBills = filtered;
    this.updatePagination();
    this.updateDisplayedBills();
  }

  private updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredBills.length / this.itemsPerPage);
    
    // Ensure current page is valid
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = 1;
    }
  }

  private updateDisplayedBills(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.displayedBills = this.filteredBills.slice(startIndex, endIndex);
  }

  changeSort(column: keyof Bill | 'patient_name' | 'doctor_name'): void {
    if (this.sortBy === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = column;
      this.sortDirection = 'asc';
    }
    
    this.currentPage = 1; // Reset to first page when sorting
    this.sortBills();
    this.updateDisplayedBills();
  }

  private sortBills(): void {
    this.filteredBills.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (this.sortBy) {
        case 'patient_name':
          aValue = this.getPatientName(a).toLowerCase();
          bValue = this.getPatientName(b).toLowerCase();
          break;
        case 'doctor_name':
          aValue = this.getDoctorName(a).toLowerCase();
          bValue = this.getDoctorName(b).toLowerCase();
          break;
        case 'issue_date':
          aValue = new Date(a.issue_date);
          bValue = new Date(b.issue_date);
          break;
        case 'amount':
          aValue = typeof a.amount === 'string' ? parseFloat(a.amount) : a.amount;
          bValue = typeof b.amount === 'string' ? parseFloat(b.amount) : b.amount;
          break;
        default:
          aValue = a[this.sortBy as keyof Bill];
          bValue = b[this.sortBy as keyof Bill];
      }

      if (aValue < bValue) return this.sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  getSortIndicator(field: string): string {
    if (this.sortBy !== field) return '';
    return this.sortDirection === 'asc' ? '↑' : '↓';
  }

  // Pagination methods - smooth client-side transitions
  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.updateDisplayedBills();
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.changePage(this.currentPage - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.changePage(this.currentPage + 1);
    }
  }

  // Smart pagination display like in users component
  get pagesToShow(): Array<number | string> {
    const pages: Array<number | string> = [];
    
    if (this.totalPages <= this.maxPagesToShow) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      // Calculate start and end of pages to show
      let start = Math.max(2, this.currentPage - Math.floor(this.maxPagesToShow / 2));
      let end = Math.min(this.totalPages - 1, start + this.maxPagesToShow - 3);
      
      // Adjust if at the end
      if (end >= this.totalPages - 1) {
        start = Math.max(2, this.totalPages - this.maxPagesToShow + 2);
      }
      
      // Show ellipsis if needed
      if (start > 2) {
        pages.push('...');
      }
      
      // Add middle pages
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      // Show ellipsis if needed
      if (end < this.totalPages - 1) {
        pages.push('...');
      }
      
      // Always show last page
      if (this.totalPages > 1) {
        pages.push(this.totalPages);
      }
    }
    
    return pages;
  }

  // Delete confirmation methods
  confirmDelete(bill: Bill): void {
    this.billToDelete = bill;
    this.showDeleteConfirmation = true;
  }

  cancelDelete(): void {
    this.billToDelete = null;
    this.showDeleteConfirmation = false;
  }

  deleteBill(): void {
    if (!this.billToDelete) return;
    
    this.billService.deleteBill(this.billToDelete.id).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        // Remove bill from local arrays
        this.bills = this.bills.filter(b => b.id !== this.billToDelete!.id);
        this.applyFilters();
        this.showDeleteConfirmation = false;
        this.billToDelete = null;
        // You could add a toast notification here
      },
      error: (error) => {
        console.error('Error deleting bill:', error);
        this.showDeleteConfirmation = false;
        this.billToDelete = null;
        // Show error message to user
        alert('Failed to delete bill: ' + (error.message || 'Unknown error'));
      }
    });
  }

  // Utility methods
  getPatientName(bill: Bill): string {
    return bill.patient?.user?.name || 
           bill.patient?.name || 
           `Patient ${bill.patient_id}`;
  }

  getDoctorName(bill: Bill): string {
    return bill.doctor?.name || 
           `Doctor ${bill.doctor_user_id}`;
  }

  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  }

  formatCurrency(amount: string | number): string {
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(numericAmount || 0);
  }

  // Action methods
  viewBill(bill: Bill): void {
    // TODO: Navigate to bill detail component
    console.log('View bill:', bill.id);
    // Example: this.router.navigate(['/admin/bills', bill.id]);
  }

  downloadPdf(bill: Bill): void {
    if (!bill.pdf_path) {
      alert('PDF not available for this bill');
      return;
    }

    this.billService.downloadBillPdf(bill.id).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${bill.bill_number}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Error downloading PDF:', error);
        alert('Failed to download PDF');
      }
    });
  }

  // Helper method to get display text for pagination
  getPaginationText(): string {
    if (this.filteredBills.length === 0) {
      return 'No bills found';
    }
    
    const startItem = (this.currentPage - 1) * this.itemsPerPage + 1;
    const endItem = Math.min(this.currentPage * this.itemsPerPage, this.filteredBills.length);
    
    return `Showing ${startItem}-${endItem} of ${this.filteredBills.length} bills`;
  }

  getRowNumber(index: number): number {
    return (this.currentPage - 1) * this.itemsPerPage + index + 1;
  }
}
