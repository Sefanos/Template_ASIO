import { Component, AfterViewInit, ElementRef, ViewChild, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';

// Register all Chart.js components
Chart.register(...registerables);

@Component({
  selector: 'app-weekly-overview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './weekly-overview.component.html',
  styleUrls: ['./weekly-overview.component.css']
})
export class WeeklyOverviewComponent implements AfterViewInit, OnDestroy {
  @ViewChild('appointmentsChart') appointmentsChartRef!: ElementRef;
  private chart: Chart | undefined;
  
  // Weekly date range
  dateRange = 'May 2 - May 8';
  
  // Weekly stats
  stats = {
    totalAppointments: 32,
    totalIncrease: '8%',
    openSlots: 12,
    openDecrease: '10%',
    followUps: 18,
    followUpsIncrease: '15%',
    newPatients: 7,
    newPatientsIncrease: '12%'
  };
  
  // Chart data would typically come from a service
  weeklyData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    values: [8, 12, 6, 9, 15, 4, 3]
  };

  constructor() { }

  ngAfterViewInit() {
    this.initChart();
  }

  ngOnDestroy() {
    // Clean up chart resources when component is destroyed
    if (this.chart) {
      this.chart.destroy();
    }
  }

  // Re-render chart on window resize
  @HostListener('window:resize')
  onResize() {
    if (this.chart) {
      this.chart.destroy();
      setTimeout(() => {
        this.initChart();
      }, 100);
    }
  }

  private initChart() {
    if (!this.appointmentsChartRef?.nativeElement) return;

    const ctx = this.appointmentsChartRef.nativeElement.getContext('2d');
    
    // Define colors based on your application's theme
    const primaryColor = '#2C6EAA';
    const urgentColor = '#EF4444';
    const infoColor = '#3B82F6';

    // Get container width to adjust chart elements for different screen sizes
    const containerWidth = this.appointmentsChartRef.nativeElement.parentElement.clientWidth;
    const isMobile = containerWidth < 640;
    const isTablet = containerWidth >= 640 && containerWidth < 1024;

    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.weeklyData.labels,
        datasets: [{
          label: 'Appointments',
          data: this.weeklyData.values,
          backgroundColor: [
            primaryColor, 
            primaryColor, 
            primaryColor, 
            primaryColor, 
            urgentColor, // Highlight Friday (current day) with urgent color
            infoColor,   // Weekend days with info color
            infoColor
          ],
          borderColor: 'transparent',
          borderRadius: 4,
          barThickness: isMobile ? 12 : (isTablet ? 14 : 16)
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: '#F5F5F5',
            titleColor: '#333',
            bodyColor: '#333',
            borderColor: '#E5E5E5',
            borderWidth: 1,
            padding: isMobile ? 8 : 12,
            cornerRadius: 8,
            displayColors: false,
            callbacks: {
              title: (items) => `${items[0].label}`,
              label: (context) => `${context.parsed.y} Appointments`
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: '#9CA3AF',
              font: {
                size: isMobile ? 9 : (isTablet ? 10 : 11)
              }
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              color: '#F3F4F6'
            },
            border: {
              display: false
            },
            ticks: {
              color: '#9CA3AF',
              font: {
                size: isMobile ? 9 : (isTablet ? 10 : 11)
              },
              stepSize: isMobile ? 3 : (isTablet ? 4 : 5),
              // On small screens, make sure we only show whole numbers
              callback: function(value) {
                if (isMobile && !Number.isInteger(Number(value))) {
                  return '';
                }
                return value;
              }
            }
          }
        }
      }
    });
  }
}
