import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription, forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

import { RevenueMetric, RevenueOverviewData } from '../../../../models/financial.model';
import { FinancialService } from '../../../../services/financial.service';

@Component({
  selector: 'app-revenue-overview',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './revenue-overview.component.html',
  styleUrls: ['./revenue-overview.component.css']
})
export class RevenueOverviewComponent implements OnInit, OnDestroy {
  // Time period selector
  selectedPeriod: string = 'month';
  periods = [
    { id: 'week', label: 'This Week' },
    { id: 'month', label: 'This Month' },
    { id: 'quarter', label: 'This Quarter' },
    { id: 'year', label: 'This Year' }
  ];
  
  // Loading state
  isLoading: boolean = false;
  hasError: boolean = false;
  errorMessage: string = '';
  
  // Revenue metrics
  metrics: RevenueMetric[] = [];
  
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
    
    // Get revenue overview and bill count in parallel
    this.dataSubscription = forkJoin({
      revenue: this.financialService.getRevenueOverview(this.selectedPeriod),
      bills: this.financialService.getBills(1, 1) // We only need pagination.total
    }).pipe(
      catchError(error => {
        this.hasError = true;
        this.errorMessage = error.message || 'Failed to load financial data. Please try again later.';
        console.error('Error loading financial data:', error);
        
        // Instead of throwing the error, return fallback data
        return of({
          revenue: this.getFallbackRevenueData(),
          bills: { pagination: { total: 48 }, items: [] }
        });
      }),
      finalize(() => {
        this.isLoading = false;
      })
    ).subscribe(data => {
      // Extract the metrics from the nested structure
      const metrics = data.revenue?.revenue_metrics || {};
      
      this.metrics = [
        {
          label: 'Total Revenue',
          value: this.formatCurrency(metrics.total_revenue || 0),
          percentChange: metrics.growth_rate || 0,
          status: (metrics.growth_rate || 0) >= 0 ? 'success' : 'urgent'
        },
        {
          label: 'Outstanding Payments',
          value: this.formatCurrency(metrics.outstanding_amount || 0),
          status: 'warning'
        },
        {
          label: 'Average Bill',
          value: this.formatCurrency(metrics.average_bill_amount || 0)
        },
        {
          label: 'Total Bills',
          // Use the actual bill count from the API instead of revenue_by_period length
          value: data.bills?.pagination?.total || 0
        }
      ];
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
   * Creates date range for the selected period
   */
  getDateRangeForPeriod(period: string): { start: Date, end: Date } {
    const today = new Date();
    let start: Date;
    let end: Date;
    
    switch(period) {
      case 'week':
        // Monday to Sunday
        const dayOfWeek = (today.getDay() + 6) % 7; // Monday=0, Sunday=6
        start = new Date(today);
        start.setDate(today.getDate() - dayOfWeek);
        start.setHours(0, 0, 0, 0);
        
        end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        break;
        
      case 'month':
        // 1st to last day of current month
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
        
      case 'quarter':
        // Calendar quarters (Q1=Jan-Mar, Q2=Apr-Jun, Q3=Jul-Sep, Q4=Oct-Dec)
        const quarterIndex = Math.floor((today.getMonth()) / 3);
        const quarterStartMonth = quarterIndex * 3;
        
        start = new Date(today.getFullYear(), quarterStartMonth, 1);
        end = new Date(today.getFullYear(), quarterStartMonth + 3, 0, 23, 59, 59, 999);
        break;
        
      case 'year':
      default:
        // Jan 1 to Dec 31
        start = new Date(today.getFullYear(), 0, 1);
        end = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;
    }
    
    return { start, end };
  }

  /**
   * Provides fallback revenue data when the API fails
   */
  private getFallbackRevenueData(): RevenueOverviewData {
    // Generate periods based on time range
    const dateRange = this.getDateRangeForPeriod(this.selectedPeriod);
    const periods = [];
    
    // For fallback data, generate periods with realistic amounts based on selected timeframe
    if (this.selectedPeriod === 'week') {
      // Generate daily data for one week
      for (let i = 0; i < 7; i++) {
        const day = new Date(dateRange.start);
        day.setDate(dateRange.start.getDate() + i);
        periods.push({
          period: `${day.getFullYear()}-${(day.getMonth() + 1).toString().padStart(2, '0')}-${day.getDate().toString().padStart(2, '0')}`,
          amount: Math.round(Math.random() * 1000 + 500)
        });
      }
    } else if (this.selectedPeriod === 'month') {
      // Generate weekly data for one month
      for (let i = 0; i < 4; i++) {
        const weekNum = Math.floor((dateRange.start.getDate() + i*7) / 7) + 1;
        periods.push({
          period: `${dateRange.start.getFullYear()}-${(dateRange.start.getMonth() + 1).toString().padStart(2, '0')}-W${weekNum}`,
          amount: Math.round(Math.random() * 4000 + 2000)
        });
      }
    } else if (this.selectedPeriod === 'quarter') {
      // Generate monthly data for one quarter
      for (let i = 0; i < 3; i++) {
        const month = dateRange.start.getMonth() + i;
        periods.push({
          period: `${dateRange.start.getFullYear()}-${(month + 1).toString().padStart(2, '0')}`,
          amount: Math.round(Math.random() * 15000 + 8000)
        });
      }
    } else {
      // Generate monthly data for one year
      for (let i = 0; i < 12; i++) {
        periods.push({
          period: `${dateRange.start.getFullYear()}-${(i + 1).toString().padStart(2, '0')}`,
          amount: Math.round(Math.random() * 15000 + 8000)
        });
      }
    }
    
    // Calculate total based on the periods
    const totalRevenue = periods.reduce((sum, p) => sum + p.amount, 0);
    
    return {
      revenue_metrics: {
        total_revenue: totalRevenue,
        period_revenue: totalRevenue * 0.5,
        previous_period_revenue: totalRevenue * 0.45,
        growth_rate: 11.8,
        average_bill_amount: 4243.82,
        outstanding_amount: totalRevenue * 0.05
      },
      revenue_by_period: periods
    };
  }
}
