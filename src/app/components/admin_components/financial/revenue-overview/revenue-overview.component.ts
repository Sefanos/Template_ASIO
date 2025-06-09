import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable, Subscription, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

import {
  MonthlyRevenueData,
  RevenueData,
  RevenueMetric,
  WeeklyRevenueData,
  YearlyRevenueData
} from '../../../../models/financial.model';
import { FinancialService } from '../../../../services/financial.service';

@Component({
  selector: 'app-revenue-overview',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './revenue-overview.component.html',
  styleUrls: ['./revenue-overview.component.css']
})
export class RevenueOverviewComponent implements OnInit, OnDestroy {
  // Time period selector - removed 'quarter' as requested
  selectedPeriod: string = 'month';
  periods = [
    { id: 'week', label: 'This Week' },
    { id: 'month', label: 'This Month' },
    { id: 'year', label: 'This Year' }
  ];
  
  // Loading state
  isLoading: boolean = false;
  hasError: boolean = false;
  errorMessage: string = '';
  
  // Revenue metrics
  metrics: RevenueMetric[] = [];
  
  // Date range
  currentDateRange: { start: string, end: string } = { start: '', end: '' };
  
  // Subscriptions
  private dataSubscription?: Subscription;
  
  constructor(private financialService: FinancialService) {}
  
  ngOnInit(): void {
    this.loadData();
  }
  
  ngOnDestroy(): void {
    if (this.dataSubscription) {
      this.dataSubscription.unsubscribe();
    }
  }
  
  /**
   * Load financial data for the selected time period
   */
  loadData(): void {
    this.isLoading = true;
    this.hasError = false;
    
    // Get the appropriate revenue data based on selected period
    let revenueObservable: Observable<RevenueData>;
    switch (this.selectedPeriod) {
      case 'week':
        revenueObservable = this.financialService.getWeeklyRevenue();
        break;
      case 'month':
        revenueObservable = this.financialService.getMonthlyRevenue();
        break;
      case 'year':
        revenueObservable = this.financialService.getYearlyRevenue();
        break;
      default:
        revenueObservable = this.financialService.getMonthlyRevenue();
    }
    
    this.dataSubscription = revenueObservable.pipe(
      catchError((error: any) => {
        this.hasError = true;
        this.errorMessage = error.message || 'Failed to load financial data. Please try again later.';
        console.error('Error loading financial data:', error);
        
        // Return fallback data based on the selected period
        return of(this.getFallbackRevenueData(this.selectedPeriod));
      }),
      finalize(() => {
        this.isLoading = false;
      })
    ).subscribe({
      next: (data: RevenueData) => {
        // Store the date range
        this.currentDateRange = {
          start: data.start_date,
          end: data.end_date
        };
        
        // Build the metrics array from the data
        this.metrics = [
          {
            label: 'Total Revenue',
            value: this.formatCurrency(data.total_revenue || 0),
            status: 'success'
          },
          {
            label: 'Average Bill',
            value: this.formatCurrency(data.average_bill_amount || 0)
          },
          {
            label: 'Total Bills',
            value: data.bill_count || 0
          },
          {
            label: 'Time Period',
            value: `${this.formatDate(data.start_date)} - ${this.formatDate(data.end_date)}`
          }
        ];
      },
      error: (error: any) => {
        console.error('Subscribe error:', error);
        this.hasError = true;
        this.errorMessage = 'An unexpected error occurred.';
      }
    });
  }
  
  /**
   * Change the selected time period and reload data
   */
  changePeriod(period: string): void {
    this.selectedPeriod = period;
    this.loadData();
  }
  
  /**
   * Format currency values consistently
   */
  formatCurrency(value: number): string {
    // Ensure value is a number before formatting
    const numericValue = isNaN(value) ? 0 : value;
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numericValue);
  }

  /**
   * Format date in a readable format
   */
  formatDate(dateString: string): string {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  }

  /**
   * Provides fallback revenue data when the API fails
   */
  private getFallbackRevenueData(period: string): RevenueData {
    const today = new Date();
    let startDate: Date;
    let endDate: Date;
    
    // Calculate appropriate date ranges based on period
    switch(period) {
      case 'week':
        // Monday to Sunday
        const dayOfWeek = (today.getDay() + 6) % 7; // Monday=0, Sunday=6
        startDate = new Date(today);
        startDate.setDate(today.getDate() - dayOfWeek);
        
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        
        return {
          total_revenue: 1500,
          average_bill_amount: 300,
          bill_count: 5,
          start_date: this.formatDateToYYYYMMDD(startDate),
          end_date: this.formatDateToYYYYMMDD(endDate),
          daily_breakdown: [
            { period: `${today.getFullYear()}-${today.getWeek()}`, amount: 1500 }
          ]
        } as WeeklyRevenueData;
        
      case 'month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        
        return {
          total_revenue: 12000,
          average_bill_amount: 600,
          bill_count: 20,
          start_date: this.formatDateToYYYYMMDD(startDate),
          end_date: this.formatDateToYYYYMMDD(endDate),
          daily_breakdown: [
            { period: `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}`, amount: 12000 }
          ]
        } as MonthlyRevenueData;
        
      case 'year':
      default:
        startDate = new Date(today.getFullYear(), 0, 1);
        endDate = new Date(today.getFullYear(), 11, 31);
        
        return {
          total_revenue: 150000,
          average_bill_amount: 1250,
          bill_count: 120,
          start_date: this.formatDateToYYYYMMDD(startDate),
          end_date: this.formatDateToYYYYMMDD(endDate),
          monthly_breakdown: [
            { period: today.getFullYear(), amount: 150000 }
          ]
        } as YearlyRevenueData;
    }
  }
  
  /**
   * Format a date to YYYY-MM-DD string
   */
  private formatDateToYYYYMMDD(date: Date): string {
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
  }
}

// Add helper method to Date prototype
declare global {
  interface Date {
    getWeek(): number;
  }
}

// Get ISO week number
Date.prototype.getWeek = function(): number {
  const date = new Date(this.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  const week1 = new Date(date.getFullYear(), 0, 4);
  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
};
