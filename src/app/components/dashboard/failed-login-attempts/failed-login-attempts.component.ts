import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import 'chartjs-adapter-date-fns';

Chart.register(...registerables);

@Component({
  selector: 'app-failed-login-attempts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './failed-login-attempts.component.html'
})
export class FailedLoginAttemptsComponent implements OnInit, AfterViewInit {
  @ViewChild('failedLoginsChart') chartCanvas!: ElementRef<HTMLCanvasElement>;
  
  chart: Chart | null = null;
  selectedRange: string = '24h';
  
  // Metrics
  totalFailedAttempts: number = 0;
  uniqueIPCount: number = 0;
  mostTargetedUser: string = '';
  alertLevel: 'normal' | 'elevated' | 'critical' = 'normal';
  
  // Sample data - will be replaced with API data
  chartData = {
    labels: [] as Date[],
    attempts: [] as number[]
  };
  
  // Common IPs with failure counts
  commonIPs: {ip: string, count: number, country?: string}[] = [];
  
  constructor() {}
  
  ngOnInit(): void {
    this.loadData();
  }
  
  ngAfterViewInit(): void {
    this.createChart();
  }
  
  loadData(): void {
    // This will be replaced with an API call
    // this.securityService.getFailedLogins(this.selectedRange).subscribe(data => {...})
    
    // Generate sample data based on the selected range
    let hoursToGenerate = 24;
    switch (this.selectedRange) {
      case '24h': hoursToGenerate = 24; break;
      case '7d': hoursToGenerate = 168; break; // 7 * 24
      case '30d': hoursToGenerate = 720; break; // 30 * 24
    }
    
    this.chartData = this.generateSampleData(hoursToGenerate);
    this.calculateMetrics();
    this.generateCommonIPs();
    
    if (this.chart) {
      this.updateChart();
    }
  }
  
  createChart(): void {
    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;
    
    const data = {
      labels: this.chartData.labels,
      datasets: [{
        label: 'Failed Login Attempts',
        data: this.chartData.attempts,
        borderColor: '#E05C5C', // Status urgent color
        backgroundColor: 'rgba(224, 92, 92, 0.1)', // Light version for fill
        fill: true,
        tension: 0.2,
        pointBackgroundColor: '#E05C5C',
        pointBorderColor: '#FFFFFF',
        pointBorderWidth: 1.5,
        pointRadius: 3,
        pointHoverRadius: 5
      }]
    };
    
    const options = {
      responsive: true,
      maintainAspectRatio: false,
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
              const date = new Date(items[0].parsed.x);
              if (this.selectedRange === '24h') {
                return date.toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit'
                });
              } else {
                return date.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });
              }
            }
          }
        }
      },
      scales: {
        x: {
          type: 'time',
          time: {
            unit: this.selectedRange === '24h' ? 'hour' : 'day',
            tooltipFormat: 'PP',
            displayFormats: {
              hour: 'HH:mm',
              day: 'MMM d'
            }
          },
          grid: {
            display: false
          },
          ticks: {
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: 6,
            color: 'rgba(84, 106, 123, 0.8)' // text-light color
          }
        },
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          },
          ticks: {
            precision: 0,
            color: 'rgba(84, 106, 123, 0.8)' // text-light color
          }
        }
      }
    };
    
    this.chart = new Chart(ctx, {
      type: 'line',
      data: data,
      options: options as any
    });
  }
  
  updateChart(): void {
    if (!this.chart) return;
    
    this.chart.data.labels = this.chartData.labels;
    this.chart.data.datasets[0].data = this.chartData.attempts;
    
    // Update x-axis unit based on selected range
    const options = this.chart.options as any;
    options.scales.x.time.unit = this.selectedRange === '24h' ? 'hour' : 'day';
    
    this.chart.update();
  }
  
  changeTimeRange(range: string): void {
    this.selectedRange = range;
    this.loadData();
  }
  
  // Generate sample data for visualization
  generateSampleData(hours: number) {
    const now = new Date();
    const labels: Date[] = [];
    const attempts: number[] = [];
    
    // Base pattern with some randomness
    // Failed logins tend to happen more during business hours and weekdays
    for (let i = hours; i > 0; i--) {
      const date = new Date(now.getTime() - (i * 60 * 60 * 1000)); // go back i hours
      
      // Get hour of day (0-23) and day of week (0-6, 0 is Sunday)
      const hour = date.getHours();
      const dayOfWeek = date.getDay();
      
      // Base likelihood factors
      let likelihood = 1;
      
      // Business hours have more activity
      if (hour >= 9 && hour <= 18) {
        likelihood *= 1.5;
      } else if (hour >= 0 && hour <= 5) {
        // Late night has less activity but could indicate attacks
        likelihood *= 0.5;
      }
      
      // Weekdays have more activity than weekends
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        likelihood *= 1.3;
      }
      
      // Random factor (0.5-1.5)
      const randomFactor = 0.5 + Math.random();
      
      // For the 24h view, add more detail/variation
      if (hours <= 24) {
        // Simulate a small "attack pattern" with multiple failures
        if (hour === 15 || hour === 10) { // Activity spike at 3PM and 10AM
          likelihood *= 2.5;
        }
      }
      
      // Calculate final count (base of 0-3 failures per hour)
      let failCount = Math.floor(likelihood * randomFactor * 2);
      
      // Add occasional spikes that could represent attack attempts
      if (Math.random() > 0.95) { // 5% chance of a spike
        failCount += Math.floor(Math.random() * 10) + 5; // Add 5-15 failures
      }
      
      labels.push(date);
      attempts.push(failCount);
    }
    
    return {
      labels,
      attempts
    };
  }
  
  calculateMetrics(): void {
    // Calculate total failed attempts
    this.totalFailedAttempts = this.chartData.attempts.reduce((sum, val) => sum + val, 0);
    
    // Generate a realistic number of unique IPs based on total attempts
    // Typically there are fewer unique IPs than attempts (some IPs try multiple times)
    this.uniqueIPCount = Math.floor(this.totalFailedAttempts * (0.4 + Math.random() * 0.3));
    
    // Set most targeted user (sample)
    const users = ['admin', 'reception', 'doctor.smith', 'nurse.johnson', 'info'];
    this.mostTargetedUser = users[Math.floor(Math.random() * users.length)];
    
    // Determine alert level based on the pattern
    const recentHours = this.chartData.attempts.slice(-6); // Last 6 data points
    const recentAvg = recentHours.reduce((sum, val) => sum + val, 0) / recentHours.length;
    const totalAvg = this.totalFailedAttempts / this.chartData.attempts.length;
    
    if (recentAvg > totalAvg * 2.5 || recentHours.some(val => val > 15)) {
      this.alertLevel = 'critical';
    } else if (recentAvg > totalAvg * 1.5 || recentHours.some(val => val > 10)) {
      this.alertLevel = 'elevated';
    } else {
      this.alertLevel = 'normal';
    }
  }
  
  generateCommonIPs(): void {
    // Sample IPs with country info
    const sampleIPs = [
      { ip: '192.168.1.105', country: 'Local Network' },
      { ip: '45.227.253.98', country: 'Brazil' },
      { ip: '103.47.192.74', country: 'India' },
      { ip: '89.163.144.82', country: 'Germany' },
      { ip: '23.94.73.121', country: 'United States' },
      { ip: '119.28.91.153', country: 'China' },
      { ip: '185.176.27.132', country: 'Russia' }
    ];
    
    // Generate 3-5 common IPs with failure counts
    const count = Math.floor(Math.random() * 3) + 3;
    this.commonIPs = [];
    
    for (let i = 0; i < count; i++) {
      const totalPct = 0.7; // 70% of failures from common IPs
      const ipIndex = Math.floor(Math.random() * sampleIPs.length);
      const failurePct = (0.4 - (i * 0.1)) * (0.8 + Math.random() * 0.4);
      
      this.commonIPs.push({
        ip: sampleIPs[ipIndex].ip,
        country: sampleIPs[ipIndex].country,
        count: Math.floor(this.totalFailedAttempts * failurePct)
      });
      
      // Remove used IP to avoid duplicates
      sampleIPs.splice(ipIndex, 1);
    }
    
    // Sort by count (highest first)
    this.commonIPs.sort((a, b) => b.count - a.count);
  }
  
  // Format date helpers
  formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  formatDateTime(date: Date): string {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  // Get range display
  getRangeDisplay(): string {
    const now = new Date();
    let startDate = new Date(now);
    
    switch (this.selectedRange) {
      case '24h':
        startDate.setHours(now.getHours() - 24);
        return `Last 24 Hours (${this.formatTime(startDate)} - ${this.formatTime(now)})`;
      case '7d':
        startDate.setDate(now.getDate() - 7);
        return `Last 7 Days (${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        return `Last 30 Days (${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`;
      default:
        return 'Custom Range';
    }
  }
  
  getAlertLevelClasses() {
    switch (this.alertLevel) {
      case 'critical':
        return 'bg-status-urgent/20 text-status-urgent';
      case 'elevated':
        return 'bg-status-warning/20 text-status-warning';
      case 'normal':
      default:
        return 'bg-status-success/20 text-status-success';
    }
  }
}