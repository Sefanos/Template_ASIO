import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Chart, ChartType, registerables } from 'chart.js';
import 'chartjs-adapter-date-fns';
import { Subscription, fromEvent } from 'rxjs';
import { AnalyticsService } from '../../../../services/analytics.service';

// Register all Chart.js components
Chart.register(...registerables);

@Component({
  selector: 'app-user-registration-trend',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './user-registration-trend.component.html'
})
export class UserRegistrationTrendComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('registrationChart') chartCanvas!: ElementRef<HTMLCanvasElement>;
  
  chart: Chart | null = null;
  selectedRange: string = '30d';
  loading = false;
  error: string | null = null;
  
  // Chart data structure
  chartData = {
    dates: [] as Date[],
    counts: [] as number[]
  };
  
  // Metrics
  totalRegistrations: number = 0;
  growthRate: number = 0;
  averageDaily: number = 0;
  peakDay: Date = new Date();
  
  private subscription = new Subscription();
  private resizeObserver: ResizeObserver | null = null;
  private chartInitialized = false;
  
  constructor(private analyticsService: AnalyticsService) {}
  
  ngOnInit(): void {
    this.loadRegistrationData();
    
    // Add visibility change detection
    this.subscription.add(
      fromEvent(document, 'visibilitychange').subscribe(() => {
        if (document.visibilityState === 'visible' && this.chartData.dates.length > 0) {
          // When tab becomes visible, check and recreate chart if needed
          setTimeout(() => {
            if (!this.chart) {
              this.createChart();
            }
          }, 100);
        }
      })
    );
  }
  
  ngAfterViewInit(): void {
    // Setup ResizeObserver for the chart container
    if (this.chartCanvas && this.chartCanvas.nativeElement) {
      this.resizeObserver = new ResizeObserver(() => {
        if (this.chart) {
          this.chart.resize();
        } else if (this.chartData.dates.length > 0) {
          this.createChart();
        }
      });
      
      this.resizeObserver.observe(this.chartCanvas.nativeElement);
    }
    
    // Add a delay for initial chart creation
    setTimeout(() => {
      if (this.chartData.dates.length > 0 && !this.chart) {
        this.createChart();
      }
    }, 200);
  }
  
  // Handle window resize events
  @HostListener('window:resize')
  onResize() {
    if (this.chart) {
      this.chart.resize();
    }
  }
  
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
    
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
  }
  
  /**
   * Load registration data from API
   */
  loadRegistrationData(): void {
    this.loading = true;
    this.error = null;
    
    this.subscription.add(
      this.analyticsService.getUserRegistrations(this.selectedRange).subscribe({
        next: (response) => {
          if (response.success) {
            try {
              // Transform string dates to Date objects for the chart
              const dates = response.data.dates.map(dateStr => new Date(dateStr));
              
              this.chartData = {
                dates: dates,
                counts: response.data.counts
              };
              
              // Set metrics from API response
              this.totalRegistrations = response.data.metrics.total_registrations;
              this.growthRate = response.data.metrics.growth_rate;
              this.averageDaily = response.data.metrics.average_daily;
              
              // Set peak day if available
              if (response.data.metrics.peak_day) {
                this.peakDay = new Date(response.data.metrics.peak_day);
              }
              
              // Update the chart - increased delay to ensure DOM is ready
              setTimeout(() => {
                if (this.chartCanvas) {
                  this.createChart();
                } else {
                  console.warn('Chart canvas not available yet');
                }
              }, 200);
            } catch (err) {
              console.error('Error processing chart data:', err);
              this.error = 'Error processing chart data';
            }
          } else {
            this.error = response.message || 'Failed to load registration data';
          }
          this.loading = false;
        },
        error: (error: Error) => {
          console.error('Error loading registration data:', error);
          this.error = error.message || 'Could not load registration data. Please try again.';
          this.loading = false;
        }
      })
    );
  }
  
  createChart(): void {
    console.log('Creating chart...');
    if (!this.chartCanvas || !this.chartCanvas.nativeElement) {
      console.error('Chart canvas element not found');
      return;
    }
    
    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) {
      console.error('Could not get 2D context from canvas element');
      return;
    }
    
    // Destroy previous chart if it exists
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
    
    // Wait for the canvas to be properly sized
    const width = this.chartCanvas.nativeElement.clientWidth;
    const height = this.chartCanvas.nativeElement.clientHeight;
    
    if (width === 0 || height === 0) {
      console.warn('Canvas has zero width or height, delaying chart creation');
      setTimeout(() => this.createChart(), 200);
      return;
    }
    
    // Calculate the appropriate height for the gradient
    const gradientFill = ctx.createLinearGradient(0, 0, 0, height);
    gradientFill.addColorStop(0, 'rgba(44, 110, 170, 0.2)');
    gradientFill.addColorStop(0.8, 'rgba(44, 110, 170, 0.0)');
    
    // Ensure we have data to display
    if (this.chartData.dates.length === 0) {
      console.warn('No data available for chart');
      return;
    }
    
    console.log(`Creating chart with ${this.chartData.dates.length} data points`);
    
    const data = {
      labels: this.chartData.dates,
      datasets: [
        {
          label: 'New Registrations',
          data: this.chartData.counts,
          borderColor: 'rgba(44, 110, 170, 1)',  // analytics-registration-primary
          backgroundColor: gradientFill,
          tension: 0.3,
          fill: true,
          pointBackgroundColor: 'rgba(44, 110, 170, 1)',
          pointBorderColor: '#fff',
          pointBorderWidth: 1,
          pointRadius: 2,
          pointHoverRadius: 4
        }
      ]
    };
    
    // Use any type to avoid TypeScript errors with Chart.js configuration
    const options: any = {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 750 // Longer animation for better visibility
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            title: (items: any[]) => {
              if (!items.length) return '';
              const item = items[0];
              const date = new Date(item.parsed.x);
              return date.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
              });
            }
          }
        }
      },
      scales: {
        x: {
          type: 'time',
          time: {
            unit: this.selectedRange === '7d' ? 'day' : 'week',
            tooltipFormat: 'PPP',
            displayFormats: {
              day: 'MMM d',
              week: 'MMM d'
            }
          },
          grid: {
            display: false,
          },
          ticks: {
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: 10,
            color: 'rgba(84, 106, 123, 0.8)'  // text-light
          }
        },
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          },
          ticks: {
            precision: 0,  // Only show whole numbers
            color: 'rgba(84, 106, 123, 0.8)'  // text-light
          }
        }
      },
      interaction: {
        intersect: false,
        mode: 'index'
      }
    };
    
    try {
      this.chart = new Chart(ctx, {
        type: 'line' as ChartType,
        data: data,
        options: options
      });
      console.log('Chart created successfully');
      this.chartInitialized = true;
    } catch (err) {
      console.error('Error creating chart:', err);
    }
  }
  
  /**
   * Change time range and update data
   */
  changeTimeRange(range: string): void {
    if (this.selectedRange === range || this.loading) return;
    
    this.selectedRange = range;
    this.loadRegistrationData();
  }
  
  /**
   * Format date for display
   */
  formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }
  
  /**
   * Get current date range for display
   */
  getDateRangeDisplay(): string {
    const endDate = new Date();
    const startDate = new Date();
    
    switch (this.selectedRange) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
    }
    
    return `${this.formatDate(startDate)} - ${this.formatDate(endDate)}`;
  }
  
  /**
   * Force re-initialization of the chart - can be called from UI
   */
  reinitializeChart(): void {
    if (this.chartData.dates.length > 0) {
      this.createChart();
    }
  }
}