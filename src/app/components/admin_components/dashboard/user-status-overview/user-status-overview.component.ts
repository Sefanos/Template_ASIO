import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Chart, ChartData, ChartType, registerables } from 'chart.js';
import { Subscription, fromEvent } from 'rxjs';
import { UserStatusCounts } from '../../../../models/analytics.model';
import { AnalyticsService } from '../../../../services/analytics.service';

Chart.register(...registerables);

@Component({
  selector: 'app-user-status-overview',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './user-status-overview.component.html',
  styles: [`
    /* Ensure chart canvas is properly displayed */
    canvas.chartjs-render-monitor {
      display: block !important;
      width: 100% !important;
      height: 100% !important;
    }
  `]
})
export class UserStatusOverviewComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('statusChart') chartCanvas!: ElementRef<HTMLCanvasElement>;
  
  chart: Chart | null = null;
  loading = true;
  error: string | null = null;
  
  // User data
  userData: UserStatusCounts = {
    active: 0,
    pending: 0,
    inactive: 0
  };
  
  newUsers: number = 0;
  timeframe: string = 'month';
  lastUpdated: Date | null = null;
  
  private subscription = new Subscription();
  private resizeObserver: ResizeObserver | null = null;
  private chartInitialized = false;
  
  // Calculated metrics
  get totalUsers(): number {
    return this.userData.active + this.userData.pending + this.userData.inactive;
  }
  
  get activePercentage(): number {
    return this.totalUsers ? Math.round((this.userData.active / this.totalUsers) * 100) : 0;
  }
  
  get pendingPercentage(): number {
    return this.totalUsers ? Math.round((this.userData.pending / this.totalUsers) * 100) : 0;
  }
  
  get inactivePercentage(): number {
    return this.totalUsers ? Math.round((this.userData.inactive / this.totalUsers) * 100) : 0;
  }
  
  constructor(private analyticsService: AnalyticsService) {}
  
  ngOnInit(): void {
    this.loadData();
    
    // Add visibility change detection to recreate chart when tab becomes visible again
    this.subscription.add(
      fromEvent(document, 'visibilitychange').subscribe(() => {
        if (document.visibilityState === 'visible' && !this.loading) {
          // When tab becomes visible, check and recreate chart if needed
          setTimeout(() => {
            if (!this.chart && this.chartCanvas) {
              console.log('Tab visible again, recreating chart');
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
          console.log('Container resized, updating chart');
          this.chart.resize();
        } else if (!this.loading && this.totalUsers > 0) {
          console.log('Container resized, creating chart');
          this.createChart();
        }
      });
      
      this.resizeObserver.observe(this.chartCanvas.nativeElement);
    }
    
    // Add a delay for initial chart creation
    setTimeout(() => {
      if (!this.loading && !this.chart && this.totalUsers > 0) {
        console.log('Initial chart creation after delay');
        this.createChart();
      }
    }, 300);
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
   * Load user status data from API
   */
  loadData(forceRefresh: boolean = false): void {
    this.loading = true;
    this.error = null;
    
    this.subscription.add(
      this.analyticsService.getUserStats(this.timeframe, forceRefresh).subscribe({
        next: (response) => {
          if (response.success) {
            this.userData = response.data.by_status;
            this.newUsers = response.data.new_users;
            this.timeframe = response.data.timeframe;
            this.lastUpdated = new Date();
            
            // Use a longer delay to ensure DOM is ready before chart creation/update
            setTimeout(() => {
              if (this.chart) {
                this.updateChart();
              } else if (this.chartCanvas) {
                this.createChart();
              }
            }, 300);
          } else {
            this.error = response.message || 'Failed to load user statistics';
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading user statistics:', error);
          this.error = error.message || 'Could not load user data. Please try again.';
          this.loading = false;
        }
      })
    );
  }
  
  /**
   * Manually refresh data
   */
  refreshData(): void {
    if (this.loading) return;
    this.loadData(true);
  }
  
  /**
   * Create chart visualization
   */
  createChart(): void {
    console.log('Creating doughnut chart...');
    
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
    
    const data: ChartData = {
      labels: ['Active', 'Pending', 'Inactive'],
      datasets: [
        {
          label: 'User Status',
          data: [this.userData.active, this.userData.pending, this.userData.inactive],
          backgroundColor: [
            '#5CBA99',  // analytics-users-active (status-success)
            '#F0B86C',  // analytics-users-pending (status-warning)
            '#8096A7',  // analytics-users-inactive (text-muted)
          ],
          borderColor: [
            '#FFFFFF',
            '#FFFFFF',
            '#FFFFFF'
          ],
          borderWidth: 2,
          hoverOffset: 4
        }
      ]
    };
    
    // Fix the options object type casting
    const options: any = {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '70%',
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              const label = context.label || '';
              const value = context.raw as number || 0;
              const percentage = Math.round((value / this.totalUsers) * 100);
              return `${label}: ${value} (${percentage}%)`;
            }
          }
        }
      },
      animation: {
        animateRotate: true,
        animateScale: true,
        duration: 800
      }
    };
    
    try {
      this.chart = new Chart(ctx, {
        type: 'doughnut' as ChartType,
        data: data,
        options: options
      });
      console.log('Doughnut chart created successfully');
      this.chartInitialized = true;
    } catch (err) {
      console.error('Error creating chart:', err);
      this.error = 'Error rendering chart. Click "Show Chart" to try again.';
    }
  }
  
  /**
   * Update chart with new data
   */
  updateChart(): void {
    if (this.chart) {
      console.log('Updating chart with new data');
      this.chart.data.datasets[0].data = [
        this.userData.active,
        this.userData.pending,
        this.userData.inactive
      ];
      this.chart.update();
    }
  }
  
  /**
   * Force re-initialization of the chart - can be called from UI
   */
  reinitializeChart(): void {
    console.log('Manual chart reinitialization requested');
    this.createChart();
  }
  
  /**
   * Format the last updated time
   */
  formatLastUpdated(): string {
    return this.lastUpdated ? this.lastUpdated.toLocaleTimeString() : 'N/A';
  }
  
  /**
   * Get timeframe in human-readable format
   */
  getTimeframeLabel(): string {
    switch (this.timeframe) {
      case 'day': return 'Today';
      case 'week': return 'This Week';
      case 'month': return 'This Month';
      case 'year': return 'This Year';
      default: return this.timeframe;
    }
  }
}
