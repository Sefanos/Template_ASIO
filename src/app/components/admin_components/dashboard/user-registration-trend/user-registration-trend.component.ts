import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import 'chartjs-adapter-date-fns';

// Register all Chart.js components
Chart.register(...registerables);

@Component({
  selector: 'app-user-registration-trend',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-registration-trend.component.html'
})
export class UserRegistrationTrendComponent implements OnInit, AfterViewInit {
  @ViewChild('registrationChart') chartCanvas!: ElementRef<HTMLCanvasElement>;
  
  chart: Chart | null = null;
  selectedRange: string = '30d';
  
  // Dummy data for sample visualization
  chartData = {
    dates: this.generateDates(30),
    counts: this.generateRegistrationData(30)
  };
  
  // Metrics
  totalRegistrations: number = 0;
  growthRate: number = 0;
  averageDaily: number = 0;
  peakDay: Date = new Date();
  
  constructor() {}
  
  ngOnInit(): void {
    this.calculateMetrics();
  }
  
  ngAfterViewInit(): void {
    this.createChart();
  }
  
  createChart(): void {
    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;
    
    if (this.chart) {
      this.chart.destroy();
    }
    
    const gradientFill = ctx.createLinearGradient(0, 0, 0, 400);
    gradientFill.addColorStop(0, 'rgba(44, 110, 170, 0.2)');
    gradientFill.addColorStop(0.8, 'rgba(44, 110, 170, 0.0)');
    
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
    
    this.chart = new Chart(ctx, {
      type: 'line',
      data: data,
      options: options
    });
  }
  
  // Generate dates for the chart
  generateDates(days: number): Date[] {
    const dates: Date[] = [];
    const today = new Date();
    
    for (let i = days; i > 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      dates.push(date);
    }
    
    return dates;
  }
  
  // Generate random registration data with a trend
  generateRegistrationData(days: number): number[] {
    const baseValue = Math.floor(Math.random() * 10) + 5;
    const counts: number[] = [];
    
    // Create a somewhat realistic pattern with weekly spikes
    for (let i = 0; i < days; i++) {
      const dayOfWeek = (i % 7); // 0 = Sunday, 6 = Saturday
      let modifier = 1;
      
      // More registrations on weekdays, less on weekends
      if (dayOfWeek === 0) modifier = 0.6;      // Sunday
      else if (dayOfWeek === 6) modifier = 0.7; // Saturday
      else if (dayOfWeek === 1) modifier = 1.3; // Monday
      
      // Add some randomness
      const randomFactor = 0.7 + Math.random() * 0.6;
      
      // Add a small upward trend over time
      const trendFactor = 1 + (i * 0.01);
      
      counts.push(Math.max(1, Math.floor(baseValue * modifier * randomFactor * trendFactor)));
    }
    
    return counts;
  }
  
  // Calculate metrics based on the current data
  calculateMetrics(): void {
    this.totalRegistrations = this.chartData.counts.reduce((sum, val) => sum + val, 0);
    
    // Calculate growth rate by comparing first half to second half
    const halfIndex = Math.floor(this.chartData.counts.length / 2);
    const firstHalf = this.chartData.counts.slice(0, halfIndex).reduce((sum, val) => sum + val, 0);
    const secondHalf = this.chartData.counts.slice(halfIndex).reduce((sum, val) => sum + val, 0);
    
    if (firstHalf > 0) {
      this.growthRate = Math.round(((secondHalf - firstHalf) / firstHalf) * 100);
    } else {
      this.growthRate = 0;
    }
    
    // Calculate average daily
    this.averageDaily = Math.round(this.totalRegistrations / this.chartData.counts.length);
    
    // Find peak day
    let maxCount = 0;
    let maxIndex = 0;
    this.chartData.counts.forEach((count, index) => {
      if (count > maxCount) {
        maxCount = count;
        maxIndex = index;
      }
    });
    
    if (this.chartData.dates[maxIndex]) {
      this.peakDay = this.chartData.dates[maxIndex];
    }
  }
  
  // Change time range and update data
  changeTimeRange(range: string): void {
    this.selectedRange = range;
    
    let days: number;
    switch (range) {
      case '7d': days = 7; break;
      case '30d': days = 30; break;
      case '90d': days = 90; break;
      default: days = 30;
    }
    
    this.chartData = {
      dates: this.generateDates(days),
      counts: this.generateRegistrationData(days)
    };
    
    this.calculateMetrics();
    this.createChart();
  }
  
  // Helper functions for display
  formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }
  
  // Get current date range for display
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
}