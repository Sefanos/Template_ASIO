import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription, finalize } from 'rxjs';
import { DoctorRevenue } from '../../../../models/analytics.model';
import { AnalyticsService } from '../../../../services/analytics.service';

@Component({
  selector: 'app-doctor-revenue-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './doctor-revenue-table.component.html',
  styleUrl: './doctor-revenue-table.component.css'
})
export class DoctorRevenueTableComponent implements OnInit, OnDestroy {
  // State management
  isLoading: boolean = false;
  hasError: boolean = false;
  errorMessage: string = '';
  
  // Data
  doctorRevenueData: DoctorRevenue[] = [];
  filteredDoctorData: DoctorRevenue[] = [];
  displayedDoctorData: DoctorRevenue[] = []; // Data for current page
  
  // Filters
  fromDate: string = this.getDefaultFromDate();
  toDate: string = this.getDefaultToDate();
  selectedDatePreset: string | null = null;
  searchTerm: string = '';
  
  // Date presets 
  datePresets = [
    { label: 'This Month', getValue: () => this.getCurrentMonth() },
    { label: 'This Year', getValue: () => this.getCurrentYear() },
    { label: 'Last 90 Days', getValue: () => this.getLast90Days() }
  ];
  
  // Sorting
  sortBy: 'doctor_name' | 'total_revenue' | 'bill_count' | 'average_bill_amount' = 'total_revenue';
  sortDirection: 'asc' | 'desc' = 'desc';
  
  // Pagination
  currentPage: number = 1;
  pageSize: number = 8;
  totalPages: number = 1;
  
  private subscriptions: Subscription[] = [];
  
  constructor(private analyticsService: AnalyticsService) {}
  
  ngOnInit(): void {
    this.loadDoctorRevenueData();
  }
  
  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
  
  /**
   * Load doctor revenue data from the API with date filters
   */
  loadDoctorRevenueData(): void {
    this.isLoading = true;
    this.hasError = false;
    
    const subscription = this.analyticsService.getDoctorRevenue(this.fromDate, this.toDate)
      .pipe(
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: (response) => {
          if (response.success && response.data.doctor_revenue) {
            this.doctorRevenueData = response.data.doctor_revenue;
            this.applyFiltersAndSort();
          } else {
            this.hasError = true;
            this.errorMessage = 'Failed to load doctor revenue data';
          }
        },
        error: (error) => {
          this.hasError = true;
          this.errorMessage = error.message || 'Failed to load doctor revenue data';
          console.error('Error loading doctor revenue data:', error);
        }
      });
    
    this.subscriptions.push(subscription);
  }
  
  /**
   * Apply filters, sorting, and update pagination
   */
  applyFiltersAndSort(): void {
    // Apply search filter
    this.filteredDoctorData = this.doctorRevenueData.filter(doctor => 
      doctor.doctor_name.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
    
    // Apply sorting
    this.filteredDoctorData.sort((a, b) => {
      let valueA = a[this.sortBy];
      let valueB = b[this.sortBy];
      
      // For string comparison (like doctor_name)
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        valueA = valueA.toLowerCase();
        valueB = valueB.toLowerCase();
      }
      
      if (this.sortDirection === 'asc') {
        return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
      } else {
        return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
      }
    });
    
    // Update pagination
    this.totalPages = Math.ceil(this.filteredDoctorData.length / this.pageSize);
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    } else if (this.currentPage < 1) {
      this.currentPage = 1;
    }
    
    // Update displayed data
    this.updateDisplayedData();
  }
  
  /**
   * Update the displayed data based on current page
   */
  updateDisplayedData(): void {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = Math.min(startIndex + this.pageSize, this.filteredDoctorData.length);
    this.displayedDoctorData = this.filteredDoctorData.slice(startIndex, endIndex);
  }
  
  /**
   * Change sort criteria
   */
  changeSort(column: 'doctor_name' | 'total_revenue' | 'bill_count' | 'average_bill_amount'): void {
    if (this.sortBy === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = column;
      // Default to descending for numeric columns, ascending for name
      this.sortDirection = column === 'doctor_name' ? 'asc' : 'desc';
    }
    
    this.applyFiltersAndSort();
  }
  
  /**
   * Go to previous page
   */
  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updateDisplayedData();
    }
  }
  
  /**
   * Go to next page
   */
  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updateDisplayedData();
    }
  }
  
  /**
   * Go to a specific page
   */
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updateDisplayedData();
    }
  }
  
  /**
   * Search by doctor name
   */
  onSearch(): void {
    this.currentPage = 1; // Reset to first page when searching
    this.applyFiltersAndSort();
  }
  
  /**
   * Clear search
   */
  clearSearch(): void {
    this.searchTerm = '';
    this.onSearch();
  }
  
  /**
   * Apply date filter and refresh data
   */
  applyDateFilter(preservePreset: boolean = false): void {
    if (!preservePreset) {
      this.selectedDatePreset = null;
    }
    
    this.loadDoctorRevenueData();
  }
  
  /**
   * Apply date preset and load data
   */
  applyDatePreset(preset: { label: string, getValue: () => { from: string, to: string } }): void {
    this.selectedDatePreset = preset.label;
    const dates = preset.getValue();
    this.fromDate = dates.from;
    this.toDate = dates.to;
    this.applyDateFilter(true); // Pass true to preserve the preset
  }
  
  /**
   * Get date range for current month
   */
  private getCurrentMonth(): { from: string, to: string } {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    return {
      from: this.formatDateForInput(firstDay),
      to: this.formatDateForInput(lastDay)
    };
  }
  
  /**
   * Get date range for current year
   */
  private getCurrentYear(): { from: string, to: string } {
    const year = new Date().getFullYear();
    return {
      from: `${year}-01-01`,
      to: `${year}-12-31`
    };
  }
  
  /**
   * Get date range for last 90 days
   */
  private getLast90Days(): { from: string, to: string } {
    const now = new Date();
    const past = new Date();
    past.setDate(now.getDate() - 90);
    
    return {
      from: this.formatDateForInput(past),
      to: this.formatDateForInput(now)
    };
  }
  
  /**
   * Format currency for display
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }
  
  /**
   * Format date for display
   */
  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }
  
  /**
   * Format date for input field
   */
  formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  /**
   * Get default from date (start of current year)
   */
  private getDefaultFromDate(): string {
    const now = new Date();
    return `${now.getFullYear()}-01-01`;
  }
  
  /**
   * Get default to date (today)
   */
  private getDefaultToDate(): string {
    return this.formatDateForInput(new Date());
  }
  
  /**
   * Get page numbers for pagination display
   */
  get pageNumbers(): number[] {
    const pages: number[] = [];
    const maxDisplayedPages = 5;
    
    if (this.totalPages <= maxDisplayedPages) {
      // Show all pages if total is less than max display
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show a subset of pages with current page in the middle
      let startPage = Math.max(this.currentPage - Math.floor(maxDisplayedPages / 2), 1);
      let endPage = startPage + maxDisplayedPages - 1;
      
      // Adjust if end page exceeds total pages
      if (endPage > this.totalPages) {
        endPage = this.totalPages;
        startPage = Math.max(endPage - maxDisplayedPages + 1, 1);
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  }
}
