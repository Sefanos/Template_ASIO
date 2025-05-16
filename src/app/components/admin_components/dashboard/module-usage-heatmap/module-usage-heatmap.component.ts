import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';

// Register all Chart.js components
Chart.register(...registerables);

@Component({
  selector: 'app-module-usage-heatmap',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './module-usage-heatmap.component.html'
})
export class ModuleUsageHeatmapComponent implements OnInit, AfterViewInit {
  @ViewChild('heatmapCanvas') heatmapCanvas!: ElementRef<HTMLCanvasElement>;
  
  chart: any;
  selectedRange: string = '30d';
  selectedModuleFilter: string = 'all';
  
  // Module categories for filtering
  moduleCategories = [
    { id: 'all', name: 'All Modules' },
    { id: 'medical', name: 'Medical Records' },
    { id: 'admin', name: 'Administrative' },
    { id: 'billing', name: 'Billing & Finance' }
  ];
  
  // Stats
  mostActiveModule: string = 'Patient Records';
  busiestDay: string = 'Wednesday';
  totalActivities: number = 2547;
  
  // Module color mapping - using Tailwind config values
  private moduleColors = {
    backgroundColor: [
      'rgba(44, 110, 170, 0.7)',  // analytics-modules-1-bg
      'rgba(96, 152, 211, 0.7)',  // analytics-modules-2-bg
      'rgba(92, 186, 153, 0.7)',  // analytics-modules-3-bg
      'rgba(240, 184, 108, 0.7)', // analytics-modules-4-bg
      'rgba(224, 92, 92, 0.7)',   // analytics-modules-5-bg
      'rgba(168, 85, 247, 0.7)',  // analytics-modules-6-bg
      'rgba(249, 115, 22, 0.7)',  // analytics-modules-7-bg
      'rgba(107, 114, 128, 0.7)', // analytics-modules-8-bg
      'rgba(16, 185, 129, 0.7)'   // analytics-modules-9-bg
    ],
    borderColor: [
      'rgba(44, 110, 170, 1)',    // analytics-modules-1-border
      'rgba(96, 152, 211, 1)',    // analytics-modules-2-border
      'rgba(92, 186, 153, 1)',    // analytics-modules-3-border
      'rgba(240, 184, 108, 1)',   // analytics-modules-4-border
      'rgba(224, 92, 92, 1)',     // analytics-modules-5-border
      'rgba(168, 85, 247, 1)',    // analytics-modules-6-border
      'rgba(249, 115, 22, 1)',    // analytics-modules-7-border
      'rgba(107, 114, 128, 1)',   // analytics-modules-8-border
      'rgba(16, 185, 129, 1)'     // analytics-modules-9-border
    ]
  };
  
  // Filter modules based on category
  get filteredModules(): string[] {
    switch (this.selectedModuleFilter) {
      case 'medical':
        return ['Patient Records', 'Medical History', 'Prescriptions'];
      case 'admin':
        return ['Appointments', 'Documents', 'Staff Management'];
      case 'billing':
        return ['Billing', 'Payments', 'Insurance'];
      default:
        return [
          'Patient Records', 'Appointments', 'Documents', 
          'Billing', 'Prescriptions', 'Medical History',
          'Payments', 'Insurance', 'Staff Management'
        ];
    }
  }
  
  // Get data for the current filter selection
  getFilteredData() {
    const modules = this.filteredModules;
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    return {
      modules: modules,
      days: days,
      data: modules.map(module => this.generateModuleData(module))
    };
  }
  
  // Generate realistic sample data based on module type
  generateModuleData(moduleName: string): number[] {
    // Base pattern for weekday usage (higher on weekdays, lower on weekends)
    const baseWeekdayPattern = [0.8, 0.9, 1.0, 0.85, 0.7, 0.3, 0.2];
    
    // Adjust base activity level by module type
    let activityMultiplier = 1;
    switch (moduleName) {
      case 'Patient Records': activityMultiplier = 4.5; break;
      case 'Appointments': activityMultiplier = 3.8; break;
      case 'Documents': activityMultiplier = 2.5; break;
      case 'Billing': activityMultiplier = 2.2; break;
      case 'Prescriptions': activityMultiplier = 3.2; break;
      case 'Medical History': activityMultiplier = 2.8; break;
      case 'Payments': activityMultiplier = 2.0; break;
      case 'Insurance': activityMultiplier = 1.5; break;
      case 'Staff Management': activityMultiplier = 1.2; break;
    }
    
    // Generate data with some randomness
    return baseWeekdayPattern.map(base => 
      Math.round(base * activityMultiplier * (10 + Math.random() * 5))
    );
  }
  
  ngOnInit(): void {
    // Calculate statistics based on the current data
    this.calculateStats();
  }
  
  ngAfterViewInit(): void {
    this.renderChart();
  }
  
  renderChart(): void {
    const ctx = this.heatmapCanvas.nativeElement.getContext('2d');
    if (!ctx) return;
    
    // Destroy previous chart if it exists
    if (this.chart) {
      this.chart.destroy();
    }
    
    const chartData = this.getFilteredData();
    
    // Create datasets for the chart
    const datasets = chartData.modules.map((module, index) => {
      return {
        label: module,
        data: chartData.data[index],
        backgroundColor: this.moduleColors.backgroundColor[index % this.moduleColors.backgroundColor.length],
        borderColor: this.moduleColors.borderColor[index % this.moduleColors.borderColor.length],
        borderWidth: 1
      };
    });
    
    // Create new chart
    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: chartData.days,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
          title: {
            display: false,
            text: 'Module Usage By Day'
          },
          tooltip: {
            mode: 'index',
            intersect: false,
          },
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 12,
              usePointStyle: true,
              pointStyle: 'circle'
            }
          }
        },
        scales: {
          x: {
            stacked: true,
            grid: {
              display: false
            },
            ticks: {
              color: '#546A7B' // text-light color from config
            }
          },
          y: {
            stacked: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            },
            ticks: {
              color: '#546A7B' // text-light color from config
            }
          }
        }
      }
    });
  }
  
  changeTimeRange(range: string): void {
    this.selectedRange = range;
    // In a real implementation, this would fetch new data for the selected time range
    // For now, we'll just regenerate sample data
    this.renderChart();
    this.calculateStats();
  }
  
  changeModuleFilter(filter: string): void {
    this.selectedModuleFilter = filter;
    this.renderChart();
    this.calculateStats();
  }
  
  // Calculate statistics based on the current data
  calculateStats(): void {
    const chartData = this.getFilteredData();
    
    // Find most active module (highest total)
    let highestTotal = 0;
    let highestModule = '';
    
    chartData.data.forEach((data, index) => {
      const total = data.reduce((sum, val) => sum + val, 0);
      if (total > highestTotal) {
        highestTotal = total;
        highestModule = chartData.modules[index];
      }
    });
    
    this.mostActiveModule = highestModule;
    
    // Find busiest day
    const dayTotals = Array(7).fill(0);
    chartData.data.forEach(moduleData => {
      moduleData.forEach((val, idx) => {
        dayTotals[idx] += val;
      });
    });
    
    let highestDayValue = 0;
    let highestDayIndex = 0;
    dayTotals.forEach((total, idx) => {
      if (total > highestDayValue) {
        highestDayValue = total;
        highestDayIndex = idx;
      }
    });
    
    this.busiestDay = chartData.days[highestDayIndex];
    
    // Calculate total activities
    this.totalActivities = chartData.data.reduce(
      (sum, dataArray) => sum + dataArray.reduce((dSum, val) => dSum + val, 0), 
      0
    );
  }
  
  // Helper to format date for display
  formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
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