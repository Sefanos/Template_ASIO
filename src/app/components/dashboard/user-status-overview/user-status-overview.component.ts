import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Chart, ChartData, ChartType, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-user-status-overview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-status-overview.component.html'
})
export class UserStatusOverviewComponent implements OnInit, AfterViewInit {
  @ViewChild('statusChart') chartCanvas!: ElementRef<HTMLCanvasElement>;
  
  chart: Chart | null = null;
  
  // Dummy data - will be replaced with API data
  userData = {
    active: 157,
    pending: 42,
    inactive: 23,
  };
  
  // Calculated metrics
  get totalUsers(): number {
    return this.userData.active + this.userData.pending + this.userData.inactive;
  }
  
  get activePercentage(): number {
    return Math.round((this.userData.active / this.totalUsers) * 100);
  }
  
  get pendingPercentage(): number {
    return Math.round((this.userData.pending / this.totalUsers) * 100);
  }
  
  get inactivePercentage(): number {
    return Math.round((this.userData.inactive / this.totalUsers) * 100);
  }
  
  constructor() {}
  
  ngOnInit(): void {
    // In real implementation, this would call an API service
    // this.userService.getUserStatusCounts().subscribe(data => {
    //   this.userData = data;
    //   this.updateChart();
    // });
  }
  
  ngAfterViewInit(): void {
    this.createChart();
  }
  
  createChart(): void {
    const ctx = this.chartCanvas.nativeElement.getContext('2d');
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
  
  // Function to fetch data from API (to be implemented)
  fetchData(): void {
    // This would be replaced with actual API call
    // this.userService.getUserStatusCounts().subscribe(data => {
    //   this.userData = data;
    //   this.updateChart();
    // });
    
    // For now, just using dummy data
    setTimeout(() => {
      this.userData = {
        active: Math.floor(Math.random() * 200) + 100,
        pending: Math.floor(Math.random() * 50) + 20,
        inactive: Math.floor(Math.random() * 40) + 10,
      };
      this.updateChart();
    }, 2000);
  }
}
