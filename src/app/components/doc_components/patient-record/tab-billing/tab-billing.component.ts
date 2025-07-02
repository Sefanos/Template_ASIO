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
}
