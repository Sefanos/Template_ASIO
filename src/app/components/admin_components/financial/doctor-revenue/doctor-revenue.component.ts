import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { Subscription, finalize } from 'rxjs';
import { DoctorRevenue } from '../../../../models/analytics.model';
import { AnalyticsService } from '../../../../services/analytics.service';

// Register Chart.js components
Chart.register(...registerables);

@Component({
  selector: 'app-doctor-revenue',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './doctor-revenue.component.html',
  styleUrl: './doctor-revenue.component.css'
})
export class DoctorRevenueComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('doctorRevenueChart') doctorRevenueCanvas!: ElementRef<HTMLCanvasElement>;

  // State management
  isLoading: boolean = false;
  hasError: boolean = false;
  errorMessage: string = '';
  
  // Data
  doctorRevenueData: DoctorRevenue[] = [];
  filteredDoctorData: DoctorRevenue[] = [];
  
  // Chart
  doctorRevenueChart: Chart | null = null;
  
  // Filters
  limitCount: number = 10;
  fromDate: string = this.getDefaultFromDate();
  toDate: string = this.getDefaultToDate();
  selectedDatePreset: string | null = null;
  
  // Date presets 
  datePresets = [
    { label: 'This Month', getValue: () => this.getCurrentMonth() },
    { label: 'This Year', getValue: () => this.getCurrentYear() },
    { label: 'Last 90 Days', getValue: () => this.getLast90Days() }
  ];
  
  // Summary metrics
  totalRevenue: number = 0;
  totalBills: number = 0;
  averageBillAmount: number = 0;
  
  // Styling
  chartColors = {
    primary: '#0358B6',
    success: '#44DE28',
    warning: '#F46300',
    danger: '#D60000',
    info: '#8B5CF6',
    secondary: '#EC4899',
    gradient: ['#0358B6', '#44DE28', '#F46300', '#D60000', '#8B5CF6']
  };
  
  private subscriptions: Subscription[] = [];
  
  constructor(private analyticsService: AnalyticsService) {}
  
  ngOnInit(): void {
    this.loadDoctorRevenueData();
  }
  
  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.doctorRevenueData.length > 0) {
        this.createDoctorRevenueChart();
      }
    }, 0);
  }
  
  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    
    if (this.doctorRevenueChart) {
      this.doctorRevenueChart.destroy();
    }
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
            this.applyFilters(); // This will set filteredDoctorData
            this.calculateSummaryMetrics();
            
            setTimeout(() => {
              this.createDoctorRevenueChart();
            }, 0);
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
   * Apply filters to the doctor revenue data
   */
  applyFilters(): void {
    // Sort by revenue (highest first)
    const sorted = [...this.doctorRevenueData].sort((a, b) => b.total_revenue - a.total_revenue);
    
    // Apply limit
    this.filteredDoctorData = sorted.slice(0, this.limitCount);
    
    // Update chart if it exists
    if (this.doctorRevenueChart) {
      this.updateDoctorRevenueChart();
    }
  }
  
  /**
   * Calculate summary metrics from the doctor revenue data
   */
  calculateSummaryMetrics(): void {
    this.totalRevenue = this.doctorRevenueData.reduce((sum, doctor) => sum + doctor.total_revenue, 0);
    this.totalBills = this.doctorRevenueData.reduce((sum, doctor) => sum + doctor.bill_count, 0);
    this.averageBillAmount = this.totalBills > 0 
      ? this.totalRevenue / this.totalBills 
      : 0;
  }
  
  /**
   * Create the horizontal bar chart for doctor revenue
   */
  createDoctorRevenueChart(): void {
    if (!this.doctorRevenueCanvas || this.filteredDoctorData.length === 0) return;
    
    const ctx = this.doctorRevenueCanvas.nativeElement.getContext('2d');
    if (!ctx) return;
    
    // Destroy existing chart if it exists
    if (this.doctorRevenueChart) {
      this.doctorRevenueChart.destroy();
    }
    
    // Prepare the chart data
    const labels = this.filteredDoctorData.map(doctor => doctor.doctor_name);
    const revenues = this.filteredDoctorData.map(doctor => doctor.total_revenue);
    
    // Color gradient based on revenue amount (higher = more green)
    const maxRevenue = Math.max(...revenues);
    const colorScale = revenues.map(revenue => {
      const ratio = revenue / maxRevenue;
      return this.getColorForRatio(ratio);
    });
    
    // Chart configuration
    const config: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Total Revenue',
          data: revenues,
          backgroundColor: colorScale.map(color => this.transparentize(color, 0.7)),
          borderColor: colorScale,
          borderWidth: 1,
          borderRadius: 4,
        }]
      },
      options: {
        indexAxis: 'y', // Horizontal bar chart
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: `Doctor Revenue (${this.formatDate(this.fromDate)} - ${this.formatDate(this.toDate)})`,
            font: { size: 14, weight: 'bold' }
          },
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const doctor = this.filteredDoctorData[context.dataIndex];
                const formattedRevenue = this.formatCurrency(doctor.total_revenue);
                return [
                  `Revenue: ${formattedRevenue}`,
                  `Bills: ${doctor.bill_count}`,
                  `Avg. Bill: ${this.formatCurrency(doctor.average_bill_amount)}`
                ];
              }
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Revenue ($)'
            },
            ticks: {
              callback: (value) => this.formatCurrencyShort(Number(value))
            }
          },
          y: {
            title: {
              display: true,
              text: 'Doctor'
            }
          }
        }
      }
    };
    
    this.doctorRevenueChart = new Chart(ctx, config);
  }
  
  /**
   * Update the doctor revenue chart when filters change
   */
  updateDoctorRevenueChart(): void {
    if (!this.doctorRevenueChart) return;
    
    const labels = this.filteredDoctorData.map(doctor => doctor.doctor_name);
    const revenues = this.filteredDoctorData.map(doctor => doctor.total_revenue);
    
    // Color gradient based on revenue amount
    const maxRevenue = Math.max(...revenues);
    const colorScale = revenues.map(revenue => {
      const ratio = revenue / maxRevenue;
      return this.getColorForRatio(ratio);
    });
    
    this.doctorRevenueChart.data.labels = labels;
    this.doctorRevenueChart.data.datasets[0].data = revenues;
    this.doctorRevenueChart.data.datasets[0].backgroundColor = colorScale.map(color => 
      this.transparentize(color, 0.7)
    );
    this.doctorRevenueChart.data.datasets[0].borderColor = colorScale;
    
    // Update title to reflect date range
    if (this.doctorRevenueChart.options && this.doctorRevenueChart.options.plugins && this.doctorRevenueChart.options.plugins.title) {
      this.doctorRevenueChart.options.plugins.title.text = `Doctor Revenue (${this.formatDate(this.fromDate)} - ${this.formatDate(this.toDate)})`;
    }
    
    this.doctorRevenueChart.update();
  }
  
  /**
   * Change the limit of doctors to display
   */
  changeLimit(newLimit: number): void {
    this.limitCount = newLimit;
    this.applyFilters();
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
   * Format currency with K/M suffix for chart labels
   */
  formatCurrencyShort(value: number): string {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toFixed(0)}`;
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
   * Apply transparency to a color
   */
  private transparentize(color: string, opacity: number): string {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  
  /**
   * Get color based on ratio (0-1)
   * Lower values are red, middle values are yellow, higher values are green
   */
  private getColorForRatio(ratio: number): string {
    if (ratio > 0.7) {
      return this.chartColors.success;
    } else if (ratio > 0.4) {
      return this.chartColors.warning;
    } else {
      return this.chartColors.danger;
    }
  }
}
