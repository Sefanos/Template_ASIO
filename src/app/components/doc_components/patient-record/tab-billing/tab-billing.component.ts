import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BillingService } from '../../../../services/doc-services/billing.service';
import { Bill } from '../../../../models/bill-management.model';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'app-tab-billing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tab-billing.component.html',
  styleUrls: ['./tab-billing.component.css']
})
export class TabBillingComponent implements OnInit {
  @Input() patientId!: number;
  bills: Bill[] = [];
  allBills: Bill[] = [];
  expandedBillId: number | null = null;
  loading = false;
  error: string | null = null;

  // Pagination and search
  page = 1;
  pageSize = 5;
  total = 0;
  search = '';

  private searchSubject = new Subject<string>();

  constructor(private billingService: BillingService) {}

  ngOnInit(): void {
    if (this.patientId) {
      this.fetchAllBills();
    }
    this.searchSubject.pipe(debounceTime(300)).subscribe(query => {
      this.page = 1;
      this.applySearch();
    });
  }

  fetchAllBills(): void {
    this.loading = true;
    this.billingService.getBillsByPatient(this.patientId).subscribe({
      next: (bills) => {
        // If bills is an object with items, extract items
        if (bills && Array.isArray((bills as any).items)) {
          this.allBills = (bills as any).items;
        } else if (Array.isArray(bills)) {
          this.allBills = bills;
        } else {
          this.allBills = [];
        }
        this.applySearch();
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load bills.';
        this.loading = false;
      }
    });
  }

  applySearch(): void {
    // Ensure allBills is always an array
    let filtered: Bill[] = Array.isArray(this.allBills) ? this.allBills : [];
    if (this.search && this.search.trim().length > 0) {
      const query = this.search.trim().toLowerCase();
      filtered = filtered.filter(bill =>
        (bill.bill_number && bill.bill_number.toLowerCase().includes(query)) ||
        (bill.amount && bill.amount.toString().includes(query)) ||
        (bill.issue_date && bill.issue_date.toLowerCase().includes(query))
        // Add more fields as needed
      );
    }
    this.total = filtered.length;
    const start = (this.page - 1) * this.pageSize;
    this.bills = filtered.slice(start, start + this.pageSize);
  }

  onSearchChange(query: string) {
    this.search = query;
    this.searchSubject.next(query);
  }

  clearSearch() {
    this.search = '';
    this.onSearchChange('');
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.page = page;
    this.applySearch();
  }

  get totalPages() {
    return Math.ceil(this.total / this.pageSize) || 1;
  }

  toggleExpand(billId: number): void {
    this.expandedBillId = this.expandedBillId === billId ? null : billId;
  }

  /**
   * Calculate total amount of all bills
   */
  getTotalAmount(): number {
    if (!Array.isArray(this.allBills)) return 0;
    return this.allBills.reduce((total, bill) => {
      const amount = typeof bill.amount === 'string' ? parseFloat(bill.amount) : (bill.amount || 0);
      return total + amount;
    }, 0);
  }

  /**
   * Get count of pending bills
   */
  getPendingCount(): number {
    if (!Array.isArray(this.allBills)) return 0;
    return this.allBills.filter(bill => this.getBillStatusText(bill).toLowerCase() === 'pending').length;
  }

  /**
   * Get count of overdue bills
   */
  getOverdueCount(): number {
    if (!Array.isArray(this.allBills)) return 0;
    return this.allBills.filter(bill => this.getBillStatusText(bill).toLowerCase() === 'overdue').length;
  }

  /**
   * Get bill status text based on bill data
   */
  getBillStatusText(bill: Bill): string {
    if (!bill.issue_date) return 'Draft';
    
    const issueDate = new Date(bill.issue_date);
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - issueDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (bill.payment_method && bill.payment_method !== 'pending') {
      return 'Paid';
    } else if (daysDiff > 30) {
      return 'Overdue';
    } else {
      return 'Pending';
    }
  }

  /**
   * Get CSS classes for bill status badge
   */
  getBillStatusClass(bill: Bill): string {
    const status = this.getBillStatusText(bill).toLowerCase();
    switch (status) {
      case 'paid':
        return 'status-success';
      case 'pending':
        return 'status-warning';
      case 'overdue':
        return 'status-urgent';
      default:
        return 'status-info';
    }
  }

  /**
   * Track by function for bill list performance
   */
  trackByBillId(index: number, bill: Bill): number {
    return bill.id;
  }

  /**
   * Get page numbers for pagination
   */
  getPageNumbers(): (number | string)[] {
    const pages: (number | string)[] = [];
    const totalPages = this.totalPages;
    const currentPage = this.page;

    if (totalPages <= 7) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first page
      pages.push(1);

      if (currentPage > 3) {
        pages.push('...');
      }

      // Show current page and surrounding pages
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('...');
      }

      // Show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  }

  /**
   * Math object for template access
   */
  Math = Math;
}
