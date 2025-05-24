import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import 'chartjs-adapter-date-fns';
import { Subscription, of, timer } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { ActivityChartData, DailyActivityData } from '../../../../models/analytics.model';
import { AnalyticsService } from '../../../../services/analytics.service';

Chart.register(...registerables);

@Component({
  selector: 'app-user-activity',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './user-activity.component.html',
  styleUrls: ['./user-activity.component.css']
})
export class UserActivityComponent implements OnInit, OnDestroy {
  @ViewChild('activityChart') chartCanvas!: ElementRef<HTMLCanvasElement>;
  
  chart: Chart | undefined;
  selectedRange: string = '30d';
  loading = false;
  error: string | null = null;
  lastUpdated: Date | null = null;
  
  // Active sessions data
  activeUsers: number = 0;
  activeSessionsUpdated: Date | null = null;
  loadingActiveSessions = false;
  activeSessionsError: string | null = null;
  
  // Activity data with colors from Tailwind config
  activityData: ActivityChartData = {
    labels: [],
    datasets: [
      {
        label: 'Logins',
        data: [],
        borderColor: '#4A8AC2', // analytics.login from tailwind config
        backgroundColor: 'rgba(74, 138, 194, 0.5)',
        fill: true,
        pointRadius: 2,
        pointHoverRadius: 4
      },
      {
        label: 'Active Sessions',
        data: [],
        borderColor: '#5CBA99', // analytics.session from tailwind config
        backgroundColor: 'rgba(92, 186, 153, 0.5)',
        fill: true,
        pointRadius: 2,
        pointHoverRadius: 4
      },
      {
        label: 'Logouts',
        data: [],
        borderColor: '#E05C5C', // analytics.logout from tailwind config
        backgroundColor: 'rgba(224, 92, 92, 0.5)',
        fill: true,
        pointRadius: 2,
        pointHoverRadius: 4
      }
    ]
  };
  
  totalLogins: number = 0;
  averageSessions: number = 0;
  peakDay: string = '';
  peakDate: string = '';
  
  private subscription = new Subscription();
  private chartConfig: ChartConfiguration | null = null;
  private readonly AUTO_REFRESH_INTERVAL = 300000; // 5 minutes
  private readonly ACTIVE_SESSIONS_REFRESH_INTERVAL = 60000; // 60 seconds
  
  constructor(
    private analyticsService: AnalyticsService,
    private router: Router
  ) {}
  
  ngOnInit(): void {
    this.loadActivityData(this.selectedRange);
    this.setupAutoRefresh();
    
    // Load active sessions initially
    this.loadActiveSessions();
    
    // Set up polling for active sessions every 60 seconds
    this.subscription.add(
      timer(this.ACTIVE_SESSIONS_REFRESH_INTERVAL, this.ACTIVE_SESSIONS_REFRESH_INTERVAL).subscribe(() => {
        this.loadActiveSessions();
      })
    );
  }
  
  ngAfterViewInit(): void {
    // Chart will be created after data is loaded
  }
  
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    if (this.chart) {
      this.chart.destroy();
    }
  }
  
  /**
   * Load current active sessions from API
   */
  loadActiveSessions(): void {
    this.loadingActiveSessions = true;
    this.activeSessionsError = null;
    
    this.subscription.add(
      this.analyticsService.getCurrentActiveSessions().pipe(
        catchError(error => {
          console.error('Error loading active sessions:', error);
          
          if (error.status === 403) {
            this.activeSessionsError = 'Permission denied';
          } else {
            this.activeSessionsError = 'Connection error';
          }
          
          return of(null);
        }),
        finalize(() => {
          this.loadingActiveSessions = false;
        })
      ).subscribe(response => {
        if (response && response.success) {
          this.activeUsers = response.data.active_users;
          this.activeSessionsUpdated = new Date();
        } else if (response) {
          this.activeSessionsError = response.message || 'Failed to load active sessions';
        }
      })
    );
  }
  
  /**
   * Manually refresh active sessions data
   */
  refreshActiveSessions(): void {
    if (this.loadingActiveSessions) return;
    this.loadActiveSessions();
  }
  
  /**
   * Set up automatic data refresh timer
   */
  private setupAutoRefresh(): void {
    this.subscription.add(
      timer(this.AUTO_REFRESH_INTERVAL, this.AUTO_REFRESH_INTERVAL).subscribe(() => {
        this.loadActivityData(this.selectedRange, true);
      })
    );
  }
  
  /**
   * Load activity data from API
   */
  loadActivityData(timeframe: string, isAutoRefresh: boolean = false): void {
    if (!isAutoRefresh) {
      this.loading = true;
    }
    this.error = null;
    
    this.subscription.add(
      this.analyticsService.getUserActivity(timeframe).pipe(
        catchError(error => {
          console.error('Error loading user activity:', error);
          
          if (error.status === 403) {
            this.error = 'You do not have permission to view analytics data.';
          } else {
            this.error = 'Could not load activity data. Please try again.';
          }
          
          return of(null);
        }),
        finalize(() => {
          if (!isAutoRefresh) {
            this.loading = false;
          }
        })
      ).subscribe(response => {
        if (response && response.success) {
          // Update summary data
          this.totalLogins = response.data.summary.total_logins;
          this.averageSessions = response.data.summary.average_sessions;
          this.peakDay = response.data.summary.peak_day.day;
          this.peakDate = response.data.summary.peak_day.date;
          
          // Transform API data for the chart
          this.transformApiDataToChartData(response.data.daily_data);
          
          // Create/update chart after data is loaded
          setTimeout(() => this.createChart(), 0);
          
          // Record last updated time
          this.lastUpdated = new Date();
        } else if (response) {
          this.error = response.message || 'Failed to load activity data';
        }
      })
    );
  }
  
  /**
   * Transform API data into chart-friendly format
   * with data point optimization for better performance
   */
  transformApiDataToChartData(dailyData: DailyActivityData[]): void {
    // Limit the number of data points for better performance
    const maxDataPoints = this.selectedRange === '90d' ? 45 : 
                          this.selectedRange === '30d' ? 30 : 
                          dailyData.length;
    
    const step = dailyData.length > maxDataPoints ? 
                Math.floor(dailyData.length / maxDataPoints) : 1;
    
    const filteredData = step > 1 ? 
                        dailyData.filter((_, index) => index % step === 0) : 
                        dailyData;
    
    // Extract data for each dataset
    this.activityData.labels = filteredData.map(item => item.date);
    this.activityData.datasets[0].data = filteredData.map(item => item.logins);
    this.activityData.datasets[1].data = filteredData.map(item => item.active_sessions);
    this.activityData.datasets[2].data = filteredData.map(item => item.logouts);
  }
  
  /**
   * Change the time range and reload data
   */
  changeTimeRange(range: string): void {
    if (this.selectedRange === range || this.loading) return;
    
    this.selectedRange = range;
    this.loadActivityData(range);
  }
  
  /**
   * Get human-readable time range label
   */
  getTimeRangeLabel(range: string): string {
    switch(range) {
      case '7d': return 'the past 7 days';
      case '30d': return 'the past 30 days';
      case '90d': return 'the past 90 days';
      default: return range;
    }
  }
  
  /**
   * Create or update the chart
   */
  createChart(): void {
    const ctx = this.chartCanvas?.nativeElement.getContext('2d');
    if (!ctx) return;
    
    if (this.chart) {
      this.chart.destroy();
    }
    
    // Use memoized config or create new one
    if (!this.chartConfig) {
      this.chartConfig = this.createChartConfig();
    } else {
      // Just update the data
      this.chartConfig.data = this.activityData;
    }
    
    this.chart = new Chart(ctx, this.chartConfig);
  }
  
  /**
   * Create chart configuration
   */
  createChartConfig(): ChartConfiguration {
    return {
      type: 'line',
      data: this.activityData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: false
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              title: (items) => {
                const date = items[0].label;
                return this.formatDate(date);
              },
              label: (context) => {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                label += context.parsed.y;
                return label;
              },
              footer: (tooltipItems) => {
                const loginValue = tooltipItems[0].parsed.y;
                const sessionsValue = tooltipItems.length > 1 ? tooltipItems[1].parsed.y : 0;
                const logoutsValue = tooltipItems.length > 2 ? tooltipItems[2].parsed.y : 0;
                
                if (sessionsValue && logoutsValue) {
                  return `Retention Rate: ${Math.round((sessionsValue - logoutsValue) / sessionsValue * 100)}%`;
                }
                return '';
              }
            }
          },
          legend: {
            position: 'bottom',
            labels: {
              usePointStyle: true,
              boxWidth: 8,
              font: {
                size: 10
              }
            }
          }
        },
        interaction: {
          mode: 'nearest',
          axis: 'x',
          intersect: false
        },
        scales: {
          x: {
            type: 'time',
            time: {
              unit: 'day',
              tooltipFormat: 'PP',
              displayFormats: {
                day: 'MMM d'
              }
            },
            grid: {
              display: false
            },
            ticks: {
              maxRotation: 0,
              font: {
                size: 10
              }
            }
          },
          y: {
            stacked: true,
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            },
            ticks: {
              font: {
                size: 10
              }
            },
            title: {
              display: false
            }
          }
        },
        elements: {
          line: {
            tension: 0.3
          },
          point: {
            radius: 2,
            hoverRadius: 4
          }
        }
      }
    };
  }
  
  /**
   * Get peak day for display
   */
  getPeakDay(): string {
    return this.peakDay || 'N/A';
  }
  
  /**
   * Get peak day with login count
   */
  getPeakDayWithCount(): string {
    if (this.peakDay && this.peakDate) {
      const peakInfo = this.activityData.labels.findIndex(date => date === this.peakDate);
      if (peakInfo !== -1) {
        const loginCount = this.activityData.datasets[0].data[peakInfo];
        return `${this.peakDay} (${loginCount} logins)`;
      }
    }
    return this.peakDay || 'N/A';
  }
  
  /**
   * Format date for display
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }
  
  /**
   * Format last updated time
   */
  formatUpdateTime(timestamp: Date | null): string {
    return timestamp ? timestamp.toLocaleTimeString() : 'N/A';
  }
}