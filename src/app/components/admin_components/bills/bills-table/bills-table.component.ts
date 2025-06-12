import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { Bill, BillListParams, PaginatedResponse } from '../../../../models/bill-management.model';
import { BillManagementService } from '../../../../services/bill-management.service';
import { BillDetailModalComponent } from '../bill-detail-modal/bill-detail-modal.component';

@Component({
  selector: 'app-bills-table',
  standalone: true,
  imports: [CommonModule, FormsModule, BillDetailModalComponent],
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
  
  // Pagination properties
  currentPage = 1;
  itemsPerPage = 15;
  totalPages = 0;
  totalItems = 0;
  maxPagesToShow = 5;
  pageNumbers: number[] = [];

  // Delete confirmation modal
  showDeleteConfirmation = false;
  billToDelete: Bill | null = null;

  // Bill detail modal
  showBillDetailModal = false;
  selectedBillId: number | null = null;

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
      this.currentPage = 1; // Reset to first page when searching
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
      sortField = 'issue_date';
    }

    const params: BillListParams = {
      sort_by: sortField,
      sort_order: this.sortDirection,
      per_page: 1000 // FIXED: Load more data for versatile search
    };

    // Only add server pagination if no search term
    if (!this.searchTerm.trim()) {
      params.page = this.currentPage;
      params.per_page = this.itemsPerPage;
    }

    // Add date filters to API params
    if (this.fromDate) {
      params.from_date = this.fromDate;
    }
    if (this.toDate) {
      params.to_date = this.toDate;
    }

    console.log('🔍 Loading bills with params:', params);

    this.billService.getBills(params).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response: PaginatedResponse<Bill>) => {
        console.log('✅ API Response received:', response.items?.length, 'bills');
        this.bills = response.items || [];
        
        // Set pagination info from server response
        if (response.pagination) {
          this.totalItems = response.pagination.total;
          if (!this.searchTerm.trim()) {
            this.totalPages = response.pagination.last_page;
            this.currentPage = response.pagination.current_page;
          }
        }
        
        console.log('🔄 Applying filters...');
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('❌ Error loading bills:', error);
        this.hasError = true;
        this.errorMessage = error?.message || 'Failed to load bills';
        this.isLoading = false;
        this.bills = [];
        this.filteredBills = [];
        this.displayedBills = [];
      }
    });
  }

  onSearchInput(): void {
    console.log('🔍 Search input changed:', this.searchTerm);
    this.searchSubject.next(this.searchTerm);
  }

  onSearch(): void {
    this.searchSubject.next(this.searchTerm);
  }

  clearSearch(): void {
    console.log('🧹 Clearing search');
    this.searchTerm = '';
    this.currentPage = 1;
    this.loadBills(); // Reload with server pagination
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

  // FIXED: Your original working search logic with debugging
  private applyFilters(): void {
    console.log('🔧 Starting applyFilters with', this.bills.length, 'bills');
    let filtered = [...this.bills];

    // Apply versatile search filter
    if (this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase().trim();
      console.log('🔍 Searching for:', searchLower);
      
      const originalCount = filtered.length;
      filtered = filtered.filter(bill => {
        const billNumber = bill.bill_number?.toLowerCase() || '';
        const patientName = this.getPatientName(bill).toLowerCase();
        const doctorName = this.getDoctorName(bill).toLowerCase();
        const paymentMethod = bill.payment_method?.toLowerCase() || '';
        const amount = bill.amount?.toString().toLowerCase() || '';
        const description = bill.description?.toLowerCase() || '';

        const matches = billNumber.includes(searchLower) ||
                       patientName.includes(searchLower) ||
                       doctorName.includes(searchLower) ||
                       paymentMethod.includes(searchLower) ||
                       amount.includes(searchLower) ||
                       description.includes(searchLower);

        return matches;
      });
      
      console.log(`🎯 Search filtered from ${originalCount} to ${filtered.length} bills`);
    }

    this.filteredBills = filtered;
    console.log('📊 Filtered bills count:', this.filteredBills.length);
    
    this.updatePagination();
    this.updateDisplayedBills();
    
    console.log('📄 Final displayed bills:', this.displayedBills.length);
  }

  private updatePagination(): void {
    if (this.searchTerm.trim()) {
      // Client-side pagination for search results
      this.totalPages = Math.ceil(this.filteredBills.length / this.itemsPerPage);
      console.log('📚 Search pagination - Total pages:', this.totalPages);
    } else {
      // Server-side pagination for non-search (already set from server)
      console.log('📚 Server pagination - Total pages:', this.totalPages);
    }
    
    // Update page numbers array
    this.pageNumbers = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(this.totalPages, startPage + maxPagesToShow - 1);
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    for (let i = startPage; i <= endPage; i++) {
      this.pageNumbers.push(i);
    }
  }

  private updateDisplayedBills(): void {
    if (this.searchTerm.trim()) {
      // Client-side pagination for search results
      const startIndex = (this.currentPage - 1) * this.itemsPerPage;
      const endIndex = startIndex + this.itemsPerPage;
      this.displayedBills = this.filteredBills.slice(startIndex, endIndex);
      console.log(`📄 Search pagination: showing ${startIndex+1}-${Math.min(endIndex, this.filteredBills.length)} of ${this.filteredBills.length}`);
    } else {
      // Server-side pagination for non-search
      this.displayedBills = this.bills;
      console.log(`📄 Server pagination: showing ${this.displayedBills.length} bills`);
    }
  }

  changeSort(column: keyof Bill | 'patient_name' | 'doctor_name'): void {
    if (this.sortBy === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = column;
      this.sortDirection = 'asc';
    }
    
    this.currentPage = 1;
    this.loadBills();
  }

  getSortIndicator(field: string): string {
    if (this.sortBy !== field) return '';
    return this.sortDirection === 'asc' ? '↑' : '↓';
  }

  changePage(page: number): void {
    if (this.searchTerm.trim()) {
      // Client-side pagination for search
      if (page >= 1 && page <= this.totalPages) {
        this.currentPage = page;
        this.updateDisplayedBills();
      }
    } else {
      // Server-side pagination for non-search
      if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
        this.currentPage = page;
        this.loadBills();
      }
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

  get pagesToShow(): Array<number | string> {
    const pages: Array<number | string> = [];
    
    if (this.totalPages <= this.maxPagesToShow) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      
      let start = Math.max(2, this.currentPage - Math.floor(this.maxPagesToShow / 2));
      let end = Math.min(this.totalPages - 1, start + this.maxPagesToShow - 3);
      
      if (end >= this.totalPages - 1) {
        start = Math.max(2, this.totalPages - this.maxPagesToShow + 2);
      }
      
      if (start > 2) {
        pages.push('...');
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (end < this.totalPages - 1) {
        pages.push('...');
      }
      
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
        this.bills = this.bills.filter(b => b.id !== this.billToDelete!.id);
        this.applyFilters();
        this.showDeleteConfirmation = false;
        this.billToDelete = null;
      },
      error: (error: any) => {
        console.error('Error deleting bill:', error);
        this.showDeleteConfirmation = false;
        this.billToDelete = null;
        alert('Failed to delete bill: ' + (error?.message || 'Unknown error'));
      }
    });
  }

  // Utility methods - UNCHANGED
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

  // Action methods - UNCHANGED
  viewBill(bill: Bill): void {
    this.selectedBillId = bill.id;
    this.showBillDetailModal = true;
  }

  onBillDetailModalClose(): void {
    this.showBillDetailModal = false;
    this.selectedBillId = null;
  }

  downloadPdf(bill: Bill): void {
    if (!bill.pdf_path) {
      alert('PDF not available for this bill');
      return;
    }

    this.billService.downloadBillPdf(bill.id).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${bill.bill_number}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error: any) => {
        console.error('Error downloading PDF:', error);
        alert('Failed to download PDF: ' + (error?.message || 'Unknown error'));
      }
    });
  }

  getPaginationText(): string {
    if (this.searchTerm.trim()) {
      // For search results
      if (this.filteredBills.length === 0) {
        return 'No bills found';
      }
      const startItem = (this.currentPage - 1) * this.itemsPerPage + 1;
      const endItem = Math.min(this.currentPage * this.itemsPerPage, this.filteredBills.length);
      return `Showing ${startItem}-${endItem} of ${this.filteredBills.length} filtered bills`;
    } else {
      // For server results
      if (this.totalItems === 0) {
        return 'No bills found';
      }
      const startItem = (this.currentPage - 1) * this.itemsPerPage + 1;
      const endItem = Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
      return `Showing ${startItem}-${endItem} of ${this.totalItems} bills`;
    }
  }

  getRowNumber(index: number): number {
    return (this.currentPage - 1) * this.itemsPerPage + index + 1;
  }
}
