import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import 'chartjs-adapter-date-fns';

Chart.register(...registerables);

@Component({
  selector: 'app-user-activity',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-activity.component.html',
  styleUrls: ['./user-activity.component.css']
})
export class UserActivityComponent implements OnInit {
  @ViewChild('activityChart') chartCanvas!: ElementRef<HTMLCanvasElement>;
  
  chart: Chart | undefined;
  selectedRange: string = '30d';
  
  // Dummy data for development
  activityData = {
    labels: this.generateDateLabels(30),
    datasets: [
      {
        label: 'Logins',
        data: this.generateRandomData(30, 20, 80),
        borderColor: '#3b82f6', // blue-500
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        fill: true
      },
      {
        label: 'Active Sessions',
        data: this.generateRandomData(30, 40, 120),
        borderColor: '#10b981', // emerald-500
        backgroundColor: 'rgba(16, 185, 129, 0.5)',
        fill: true
      },
      {
        label: 'Logouts',
        data: this.generateRandomData(30, 15, 75),
        borderColor: '#ef4444', // red-500
        backgroundColor: 'rgba(239, 68, 68, 0.5)',
        fill: true
      }
    ]
  };
  
  totalLogins: number = this.calculateTotal(this.activityData.datasets[0].data);
  peakDayIndex: number = this.findPeakDay(this.activityData.datasets[0].data);
  averageSessions: number = Math.round(this.calculateAverage(this.activityData.datasets[1].data));
  
  ngOnInit(): void {}
  
  ngAfterViewInit(): void {
    this.createChart();
  }
  
  createChart(): void {
    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (ctx) {
      this.chart?.destroy();
      
      const config: ChartConfiguration = {
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
                  return new Date(items[0].parsed.x).toLocaleDateString();
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
            }
          }
        }
      };
      
      this.chart = new Chart(ctx, config);
    }
  }
  
  changeTimeRange(range: string): void {
    this.selectedRange = range;
    
    let days: number;
    switch (range) {
      case '7d': days = 7; break;
      case '30d': days = 30; break;
      case '90d': days = 90; break;
      default: days = 30;
    }
    
    // Update chart data
    this.activityData.labels = this.generateDateLabels(days);
    this.activityData.datasets[0].data = this.generateRandomData(days, 20, 80);
    this.activityData.datasets[1].data = this.generateRandomData(days, 40, 120);
    this.activityData.datasets[2].data = this.generateRandomData(days, 15, 75);
    
    // Update stats
    this.totalLogins = this.calculateTotal(this.activityData.datasets[0].data);
    this.peakDayIndex = this.findPeakDay(this.activityData.datasets[0].data);
    this.averageSessions = Math.round(this.calculateAverage(this.activityData.datasets[1].data));
    
    // Update chart
    this.createChart();
  }
  
  // Utility methods for generating dummy data
  generateDateLabels(days: number): string[] {
    const labels: string[] = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      labels.push(date.toISOString().split('T')[0]);
    }
    
    return labels;
  }
  
  generateRandomData(days: number, min: number, max: number): number[] {
    return Array.from({ length: days }, () => Math.floor(Math.random() * (max - min + 1) + min));
  }
  
  calculateTotal(data: number[]): number {
    return data.reduce((sum, value) => sum + value, 0);
  }
  
  calculateAverage(data: number[]): number {
    return data.length ? data.reduce((sum, value) => sum + value, 0) / data.length : 0;
  }
  
  findPeakDay(data: number[]): number {
    let maxIndex = 0;
    let maxValue = data[0] || 0;
    
    for (let i = 1; i < data.length; i++) {
      if (data[i] > maxValue) {
        maxValue = data[i];
        maxIndex = i;
      }
    }
    
    return maxIndex;
  }
  
  getPeakDay(): string {
    if (this.activityData.labels.length > this.peakDayIndex) {
      return new Date(this.activityData.labels[this.peakDayIndex]).toLocaleDateString('en-US', { weekday: 'long' });
    }
    return 'Monday';
  }
}