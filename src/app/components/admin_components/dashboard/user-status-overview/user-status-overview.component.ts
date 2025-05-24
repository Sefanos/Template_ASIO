import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Chart, ChartData, ChartType, registerables } from 'chart.js';
import { Subscription } from 'rxjs';
import { UserStatusCounts } from '../../../../models/analytics.model';
import { AnalyticsService } from '../../../../services/analytics.service';

Chart.register(...registerables);

@Component({
  selector: 'app-user-status-overview',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './user-status-overview.component.html'
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
  }
  
  ngAfterViewInit(): void {
    if (!this.loading) {
      this.createChart();
    }
  }
  
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    if (this.chart) {
      this.chart.destroy();
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
            
            if (this.chart) {
              this.updateChart();
            } else if (this.chartCanvas) {
              this.createChart();
            }
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
    const ctx = this.chartCanvas?.nativeElement.getContext('2d');
    if (!ctx) return;
    
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
        duration: 1000
      }
    };
    
    this.chart = new Chart(ctx, {
      type: 'doughnut' as ChartType,
      data: data,
      options: options
    });
  }
  
  /**
   * Update chart with new data
   */
  updateChart(): void {
    if (this.chart) {
      this.chart.data.datasets[0].data = [
        this.userData.active,
        this.userData.pending,
        this.userData.inactive
      ];
      this.chart.update();
    }
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
