import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { Subscription, finalize } from 'rxjs';
import { ServiceBreakdown } from '../../../../models/analytics.model';
import { AnalyticsService } from '../../../../services/analytics.service';

// Register Chart.js components
Chart.register(...registerables);

@Component({
  selector: 'app-service-revenue',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './service-revenue.component.html',
  styleUrl: './service-revenue.component.css'
})
export class ServiceRevenueComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('servicePercentageChart') servicePercentageCanvas!: ElementRef<HTMLCanvasElement>;

  // State management
  isLoading: boolean = false;
  hasError: boolean = false;
  errorMessage: string = '';
  
  // Data
  serviceBreakdownData: ServiceBreakdown[] = [];
  filteredServiceData: ServiceBreakdown[] = [];
  
  // Chart
  servicePercentageChart: Chart | null = null;
  
  // Filters
  limitCount: number = 10;
  
  // Styling
  chartColors = {
    background: [
      'rgba(54, 162, 235, 0.8)',
      'rgba(75, 192, 192, 0.8)',
      'rgba(255, 159, 64, 0.8)',
      'rgba(255, 99, 132, 0.8)',
      'rgba(153, 102, 255, 0.8)',
      'rgba(255, 205, 86, 0.8)',
      'rgba(201, 203, 207, 0.8)',
      'rgba(54, 162, 235, 0.8)'
    ],
    border: [
      'rgb(54, 162, 235)',
      'rgb(75, 192, 192)',
      'rgb(255, 159, 64)',
      'rgb(255, 99, 132)',
      'rgb(153, 102, 255)',
      'rgb(255, 205, 86)',
      'rgb(201, 203, 207)',
      'rgb(54, 162, 235)'
    ]
  };
  
  private subscriptions: Subscription[] = [];
  private refreshInterval: any;
  private chartsInitialized: boolean = false;
  
  constructor(private analyticsService: AnalyticsService) {}
  
  ngOnInit(): void {
    this.loadServiceBreakdownData();
  }
  
  ngAfterViewInit(): void {
    // Initialization will be handled in the loadServiceBreakdownData response
  }
  
  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    
    if (this.servicePercentageChart) {
      this.servicePercentageChart.destroy();
    }
    
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }
  
  /**
   * Load service breakdown data from the API
   */
  loadServiceBreakdownData(): void {
    this.isLoading = true;
    this.hasError = false;
    
    const subscription = this.analyticsService.getServiceBreakdown()
    .pipe(
      finalize(() => {
        this.isLoading = false;
      })
    )
    .subscribe({
      next: (response) => {
        console.log('Service breakdown response:', response);
        if (response.success && response.data.service_breakdown) {
          this.serviceBreakdownData = response.data.service_breakdown;
          
          this.applyFilters(); // This will set filteredServiceData
          
          setTimeout(() => {
            if (!this.chartsInitialized) {
              this.createPieChart();
              this.chartsInitialized = true;
            } else {
              this.updatePieChart();
            }
          }, 0);
        } else {
          this.hasError = true;
          this.errorMessage = 'Failed to load service revenue data';
        }
      },
      error: (error) => {
        this.hasError = true;
        this.errorMessage = error.message || 'Failed to load service revenue data';
        console.error('Error loading service revenue data:', error);
      }
    });

    this.subscriptions.push(subscription);
  }
  
  /**
   * Apply filters to the service breakdown data
   */
  applyFilters(reloadData: boolean = false): void {
    if (reloadData) {
      this.loadServiceBreakdownData();
      return;
    }

    // Sort by revenue (highest first)
    const sorted = [...this.serviceBreakdownData].sort((a, b) => b.total_revenue - a.total_revenue);
    
    // Apply limit
    this.filteredServiceData = sorted.slice(0, this.limitCount);
    
    // Update chart if it exists
    if (this.servicePercentageChart) {
      this.updatePieChart();
    }
  }
  
  /**
   * Create the pie chart for service percentage breakdown
   */
  createPieChart(): void {
    const ctx = this.servicePercentageCanvas.nativeElement.getContext('2d');
    if (!ctx || this.filteredServiceData.length === 0) return;
    
    // Destroy existing chart if it exists
    if (this.servicePercentageChart) {
      this.servicePercentageChart.destroy();
    }
    
    // Calculate total revenue for percentages
    const totalRevenue = this.filteredServiceData.reduce((sum, service) => sum + service.total_revenue, 0);
    
    // Prepare the chart data
    const labels = this.filteredServiceData.map(service => service.service_type);
    const percentages = this.filteredServiceData.map(service => {
      return (service.total_revenue / totalRevenue) * 100;
    });
    
    // Chart configuration
    const config: ChartConfiguration<'pie'> = {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          data: percentages,
          backgroundColor: this.chartColors.background.slice(0, this.filteredServiceData.length),
          borderColor: this.chartColors.border.slice(0, this.filteredServiceData.length),
          borderWidth: 1,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 500
        },
        plugins: {
          title: {
            display: true,
            text: 'Revenue Percentage by Service',
            font: { size: 14, weight: 'bold' }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const percentage = context.parsed;
                const service = this.filteredServiceData[context.dataIndex];
                return [
                  `${service.service_type}: ${percentage.toFixed(1)}%`,
                  `Revenue: ${this.formatCurrency(service.total_revenue)}`
                ];
              }
            }
          }
        }
      }
    };
    
    this.servicePercentageChart = new Chart(ctx, config);
  }
  
  /**
   * Update pie chart when filters change
   */
  updatePieChart(): void {
    if (this.servicePercentageChart) {
      // Calculate total revenue for percentages
      const totalRevenue = this.filteredServiceData.reduce((sum, service) => sum + service.total_revenue, 0);
      
      const labels = this.filteredServiceData.map(service => service.service_type);
      const percentages = this.filteredServiceData.map(service => {
        return (service.total_revenue / totalRevenue) * 100;
      });
      
      this.servicePercentageChart.data.labels = labels;
      this.servicePercentageChart.data.datasets[0].data = percentages;
      this.servicePercentageChart.data.datasets[0].backgroundColor = this.chartColors.background.slice(0, this.filteredServiceData.length);
      this.servicePercentageChart.data.datasets[0].borderColor = this.chartColors.border.slice(0, this.filteredServiceData.length);
      
      this.servicePercentageChart.update();
    }
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
   * Start automatic data refresh at the specified interval
   */
  startAutoRefresh(intervalMs: number = 60000): void {
    this.refreshInterval = setInterval(() => {
      this.loadServiceBreakdownData();
    }, intervalMs);
  }
}
