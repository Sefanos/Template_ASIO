import { Component, AfterViewInit, OnInit, OnDestroy } from '@angular/core';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { CommonModule, registerLocaleData } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Chart from 'chart.js/auto';
import localeFr from '@angular/common/locales/fr';

// Enregistrer la locale française
registerLocaleData(localeFr);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  imports: [NgFor, NgIf, NgClass, CommonModule, FormsModule]
})
export class DashboardComponent implements AfterViewInit, OnInit, OnDestroy {
  todayAppointments = 12;
  pendingPatients = 3;
  finishedPatients = 25;
  latePatients = 7;
  currentDate = new Date();
  renderedCharts = false;

  // Liste complète des rendez-vous du jour
  todayAppointmentsList = [
    {
      initials: 'SM', name: 'Salwa Slimani',
      type: 'Consultation',
      doctor: 'Dr. Kamal Berrada',
      time: '09:00',
      status: 'completed',
      photo: 'assets/receptionist/images/FE.jpg'
    },
    {
      initials: 'MH', name: 'Mohamed Hariri',
      type: 'Contrôle',
      doctor: 'Dr. Kamal Berrada',
      time: '10:30',
      status: 'upcoming',
      photo: 'assets/receptionist/images/eps3.jpg'
    },
    {
      initials: 'FA', name: 'Fatima Amrani',
      type: 'Consultation',
      doctor: 'Dr. Kamal Berrada',
      time: '11:15',
      status: 'late',
      photo: 'assets/receptionist/images/eps1.jpg'
    },
    {
      initials: 'AA', name: 'Adam AbouAli',
      type: 'Consultation',
      doctor: 'Dr. Kamal Berrada',
      time: '12:00',
      status: 'upcoming',
      photo: 'assets/receptionist/images/P4.jpg'
    }
  ];

  get upcomingAppointments() {
    return this.todayAppointmentsList.filter(a => a.status === 'upcoming');
  }

  selectedStat: string | null = null;
  openStatModal(stat: string) { this.selectedStat = stat; }
  closeStatModal() { this.selectedStat = null; }

  calendarEvents = [
    { title: 'Dr. Imane - Mr. Kamal', time: '10:00', photo: 'assets/images/doctor5.jpg' },
    { title: 'Dr. Mehdi - Mme. Hilal', time: '11:30', photo: 'assets/images/doctor1.jpg' },
    { title: 'Dr. Mohammed - M. Walid', time: '14:00', photo: 'assets/images/doctor3.jpg' }
  ];

  showAppointmentForm = false;
  showPatientForm = false;
  userName = 'Omar Bennani';
  demographicFilter: 'age' | 'gender' = 'age';
  private demographicChart: Chart | null = null;
  private weeklyOverviewChart: Chart | null = null;
  private rdvChart: Chart | null = null;
  private weeklyChartResizeObserver: ResizeObserver | null = null;
  private chartResizeObserver: ResizeObserver | null = null;
  private boundHandleWindowResize: any = null;
  private resizeTimeout: any = null;

  ngOnInit(): void {}

  ngOnDestroy(): void {
    // Safely destroy all charts with proper null checking
    if (this.demographicChart) {
      this.demographicChart.destroy();
      this.demographicChart = null;
    }
    
    if (this.weeklyOverviewChart) {
      this.weeklyOverviewChart.destroy();
      this.weeklyOverviewChart = null;
    }
    
    if (this.rdvChart) {
      this.rdvChart.destroy();
      this.rdvChart = null;
    }
    
    // Clean up resize observers
    if (this.chartResizeObserver) {
      this.chartResizeObserver.disconnect();
      this.chartResizeObserver = null;
    }
    
    if (this.weeklyChartResizeObserver) {
      this.weeklyChartResizeObserver.disconnect();
      this.weeklyChartResizeObserver = null;
    }
    
    // Remove event listeners
    if (this.boundHandleWindowResize) {
      window.removeEventListener('resize', this.boundHandleWindowResize);
      this.boundHandleWindowResize = null;
    }
    
    // Clear any pending resize timeout
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = null;
    }
  }

  ngAfterViewInit(): void {
    // Slight delay to ensure DOM is fully rendered
    setTimeout(() => {
      this.initRdvChart();
      this.initGenderChart();
      this.initAgeChart();
      this.initWeeklyOverviewChart();
      this.renderDemographicChart();
      this.initPatientsLineChart();
      
      this.renderedCharts = true;

      // Add window resize listener to handle responsive behavior
      // Store bound function to be able to remove it later
      this.boundHandleWindowResize = this.handleWindowResize.bind(this);
      window.addEventListener('resize', this.boundHandleWindowResize);
    }, 100);
  }

  private handleWindowResize(): void {
    // Clear existing timeout to debounce frequent resize events
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
    
    // Set a timeout to resize after resize events have stopped
    this.resizeTimeout = setTimeout(() => {
      // Force recalculation of chart dimensions only if chart exists and not destroyed
      if (this.weeklyOverviewChart) {
        const container = document.querySelector('.chart-container') as HTMLElement;
        if (container) {
          // Get the canvas element
          const canvas = document.getElementById('weekly-overview-chart') as HTMLCanvasElement;
          if (canvas) {
            // Update canvas dimensions to match container
            const containerRect = container.getBoundingClientRect();
            canvas.width = containerRect.width;
            canvas.height = containerRect.height;
            
            // Ensure styles are correct to fill entire container
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            canvas.style.display = 'block';
            
            // Update the chart dimensions
            this.weeklyOverviewChart.resize();
            this.weeklyOverviewChart.update();
          }
        }
      }
    }, 100);
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'completed': return 'Terminé';
      case 'upcoming': return 'À venir';
      case 'late': return 'En retard';
      default: return status;
    }
  }

  initRdvChart(): void {
    const ctx = document.getElementById('appointments-chart') as HTMLCanvasElement;
    if (!ctx) return;

    if (this.rdvChart) this.rdvChart.destroy();

    this.rdvChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven'],
        datasets: [{
          label: 'Nombre de RDV',
          data: [5, 7, 3, 6, 4],
          backgroundColor: '#3b82f6',
          hoverBackgroundColor: '#2563eb',
          borderRadius: 10
        }]
      },
      options: {
        responsive: true,
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#64748b' }
          },
          y: {
            beginAtZero: true,
            grid: { color: '#e5e7eb' },
            ticks: { color: '#64748b' }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(255,255,255,0.95)',
            titleColor: '#2563eb',
            bodyColor: '#334155',
            borderColor: '#2563eb',
            borderWidth: 1
          }
        }
      }
    });
  }

  initGenderChart() {
    const genderCtx = document.getElementById('gender-distribution-chart') as HTMLCanvasElement;
    if (!genderCtx) return;

    new Chart(genderCtx, {
      type: 'doughnut',
      data: {
        labels: ['Femmes', 'Hommes'],
        datasets: [{
          label: 'Patients',
          data: [499, 749],
          backgroundColor: ['#3b82f6', '#f59e0b'],
          hoverBackgroundColor: ['#2c6dd5', '#eab308'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        cutout: '60%',
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(255,255,255,0.95)',
            titleColor: '#2563eb',
            bodyColor: '#334155',
            callbacks: {
              label: (context) => `${context.label}: ${context.parsed}%`
            }
          }
        }
      }
    });
  }

  initAgeChart() {
    const ageCtx = document.getElementById('age-distribution-chart') as HTMLCanvasElement;
    if (!ageCtx) return;

    new Chart(ageCtx, {
      type: 'bar',
      data: {
        labels: ['0-18 ans', '19-35 ans', '36-50 ans', '51-65 ans', '65+ ans'],
        datasets: [{
          label: 'Patients (%)',
          data: [18, 25, 32, 15, 10],
          backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#dc3545'],
          borderRadius: 5,
          barPercentage: 0.6,
          categoryPercentage: 0.7
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(255,255,255,0.95)',
            titleColor: '#2563eb',
            bodyColor: '#334155',
            callbacks: {
              label: (context) => `${context.label}: ${context.raw}%`
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: { stepSize: 10, color: '#64748b' },
            grid: { color: '#e5e7eb' }
          },
          y: {
            grid: { display: false },
            ticks: { color: '#64748b' }
          }
        }
      }
    });
  }

  initWeeklyOverviewChart() {
    const weeklyCtx = document.getElementById('weekly-overview-chart') as HTMLCanvasElement;
    if (!weeklyCtx) return;

    if (this.weeklyOverviewChart) this.weeklyOverviewChart.destroy();
    
    // Assurez-vous que le canvas a des dimensions adéquates
    weeklyCtx.style.width = '100%';
    weeklyCtx.style.height = '100%';
    weeklyCtx.style.display = 'block';
    
    // Créer le dégradé pour le fond du graphique
    const ctx = weeklyCtx.getContext('2d');
    let gradient = null;
    if (ctx) {
      gradient = ctx.createLinearGradient(0, 0, 0, 240);
      gradient.addColorStop(0, 'rgba(59, 130, 246, 0.5)');
      gradient.addColorStop(0.6, 'rgba(59, 130, 246, 0.2)');
      gradient.addColorStop(1, 'rgba(59, 130, 246, 0.05)');
    }

    // Configurez le conteneur du graphique
    const chartContainer = document.querySelector('.chart-container') as HTMLElement;
    if (chartContainer) {
      chartContainer.style.width = '100%';
      chartContainer.style.height = '240px';
      chartContainer.style.position = 'relative';
      chartContainer.style.margin = '10px 0';
      
      // Configurer l'observateur de redimensionnement
      if (this.weeklyChartResizeObserver) {
        this.weeklyChartResizeObserver.disconnect();
      }
      
      this.weeklyChartResizeObserver = new ResizeObserver(() => {
        if (this.weeklyOverviewChart) {
          setTimeout(() => {
            if (this.weeklyOverviewChart) {
              this.weeklyOverviewChart.resize();
              this.weeklyOverviewChart.update();
            }
          }, 50);
        }
      });
      
      this.weeklyChartResizeObserver.observe(chartContainer);
    }
    
    // Création du graphique avec une configuration améliorée pour les axes
    this.weeklyOverviewChart = new Chart(weeklyCtx, {
      type: 'line',
      data: {
        labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
        datasets: [{
          label: 'Rendez-vous',
          data: [6, 8, 5, 9, 7, 4, 3],
          backgroundColor: gradient || 'rgba(59, 130, 246, 0.2)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 3,
          pointBackgroundColor: '#ffffff',
          pointBorderColor: 'rgb(59, 130, 246)',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7,
          tension: 0.4,
          fill: true,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        
        elements: {
          line: {
            tension: 0.4,
            borderWidth: 3
          },
          point: {
            radius: 5,
            hoverRadius: 7,
            backgroundColor: '#ffffff',
            borderWidth: 2
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            titleColor: '#1e40af',
            bodyColor: '#334155',
            padding: 12,
            cornerRadius: 6,
            borderColor: 'rgba(59, 130, 246, 0.3)',
            borderWidth: 1,
            titleFont: {
              size: 14,
              weight: 'bold'
            },
            bodyFont: {
              size: 13
            },
            displayColors: false,
            callbacks: {
              title: function(tooltipItems: any[]) {
                return tooltipItems[0].label;
              },
              label: function(context: any) {
                return `${context.formattedValue} rendez-vous`;
              }
            }
          }
        },
        scales: {
          x: {
            display: true,
            grid: { 
              display: false 
            },
            border: {
              display: true,
              width: 1,
              color: '#cbd5e1'
            },
            ticks: { 
              color: '#64748b',
              font: {
                size: 12,
                weight: 600
              },
              padding: 8
            }
          },
          y: {
            display: true,
            beginAtZero: true,
            suggestedMax: 12,
            border: {
              display: true,
              width: 1,
              color: '#cbd5e1'
            },
            grid: { 
              color: '#f1f5f9',
              lineWidth: 1
            },
            ticks: { 
              color: '#64748b',
              font: {
                size: 12,
                weight: 500
              },
              padding: 8,
              stepSize: 2,
              callback: function(value: any) {
                // N'afficher que des nombres entiers
                if (Math.floor(value) === value) {
                  return value;
                }
              }
            }
          }
        },
        animation: {
          duration: 1000,
          easing: 'easeOutQuad'
        },
        layout: {
          padding: {
            left: 5,
            right: 5,
            top: 10,
            bottom: 10
          }
        }
      }
    });
  }

  renderDemographicChart() {
    const ctx = document.getElementById('demographic-chart') as HTMLCanvasElement;
    if (!ctx) return;

    let data, labels;
    let backgroundColors, hoverBackgroundColors;

    function createGradient(ctx: any, colors: string[]) {
      try {
        const chartWidth = ctx.canvas.width || 300;
        const chartHeight = ctx.canvas.height || 300;
        const gradient = ctx.createLinearGradient(0, 0, 0, chartHeight);
        gradient.addColorStop(0, colors[0]);
        gradient.addColorStop(1, colors[1]);
        return gradient;
      } catch (e) {
        console.error('Erreur lors de la création du dégradé:', e);
        return colors[0];
      }
    }

    if (this.demographicFilter === 'age') {
      labels = ['0-18 ans', '19-35 ans', '36-50 ans', '51-65 ans', '65+ ans'];
      data = [18, 25, 32, 15, 10];

      backgroundColors = [
        createGradient(ctx, ['#3b82f6', '#1d4ed8']),
        createGradient(ctx, ['#10b981', '#059669']),
        createGradient(ctx, ['#f59e0b', '#d97706']),
        createGradient(ctx, ['#8b5cf6', '#6d28d9']),
        createGradient(ctx, ['#ef4444', '#b91c1c'])
      ];
      hoverBackgroundColors = [
        createGradient(ctx, ['#60a5fa', '#2563eb']),
        createGradient(ctx, ['#34d399', '#059669']),
        createGradient(ctx, ['#fbbf24', '#d97706']),
        createGradient(ctx, ['#a78bfa', '#7c3aed']),
        createGradient(ctx, ['#f87171', '#dc2626'])
      ];
    } else {
      labels = ['Femmes', 'Hommes'];
      data = [40, 60];

      backgroundColors = [
        createGradient(ctx, ['#3b82f6', '#1d4ed8']),
        createGradient(ctx, ['#f59e0b', '#d97706'])
      ];
      hoverBackgroundColors = [
        createGradient(ctx, ['#60a5fa', '#2563eb']),
        createGradient(ctx, ['#fbbf24', '#d97706'])
      ];
    }

    if (this.demographicChart) this.demographicChart.destroy();

    const shadowPlugin = {
      id: 'shadowPlugin',
      beforeDraw: (chart: any) => {
        const { ctx } = chart;
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
        ctx.shadowBlur = 15;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 5;
        ctx.restore();
      }
    };

    this.demographicChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: backgroundColors,
          hoverBackgroundColor: hoverBackgroundColors,
          borderWidth: 3,
          borderColor: '#ffffff',
          hoverOffset: 16,
          borderRadius: 4,
          offset: 8,
          spacing: 2
        }]
      },
      options: {
        cutout: '75%',
        radius: '90%',
        plugins: {
          legend: { display: false },
          tooltip: {
            enabled: true,
            backgroundColor: 'rgba(255,255,255,0.98)',
            titleColor: '#1e40af',
            bodyColor: '#1f2937',
            borderColor: 'rgba(99, 102, 241, 0.3)',
            borderWidth: 2,
            cornerRadius: 8,
            boxPadding: 8,
            padding: { top: 12, bottom: 12, left: 16, right: 16 },
            titleFont: { size: 14, weight: 'bold' },
            bodyFont: { size: 14 },
            displayColors: true,
            callbacks: {
              title: (tooltipItems: any) => tooltipItems[0].label,
              label: (context: any) => ` ${context.parsed} % du total`,
              labelTextColor: () => '#334155'
            }
          }
        },
        layout: { padding: { top: 24, bottom: 24, left: 20, right: 20 } },
        animation: {
          animateScale: true,
          animateRotate: true,
          duration: 1800,
          easing: 'easeOutCirc',
          delay: (context) => context.dataIndex * 150
        },
        responsive: true,
        maintainAspectRatio: false
      },
      plugins: [shadowPlugin]
    });
  }

  initPatientsLineChart() {
    const ctx = document.getElementById('patients-line-chart') as HTMLCanvasElement;
    if (!ctx) return;

    new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [
          {
            label: 'Male',
            data: [12, 14, 13, 16, 18, 17, 19, 20, 18, 17, 16, 15],
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59,130,246,0.08)',
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            borderWidth: 3
          },
          {
            label: 'Female',
            data: [10, 12, 11, 13, 15, 14, 16, 19, 17, 16, 15, 14],
            borderColor: '#60a5fa',
            backgroundColor: 'rgba(96,165,250,0.08)',
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            borderWidth: 3
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#fff',
            titleColor: '#2563eb',
            bodyColor: '#334155',
            borderColor: '#2563eb',
            borderWidth: 1,
            padding: 12,
            displayColors: false,
            callbacks: {
              label: (context: any) => `${context.parsed.y} Patients`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#64748b', font: { weight: 'bold', size: 14 } }
          },
          y: {
            beginAtZero: true,
            grid: { color: '#e0e7ef' },
            ticks: { color: '#64748b', font: { size: 13 } }
          }
        },
        animation: {
          duration: 1200,
          easing: 'easeOutQuart'
        }
      }
    });
  }

  // Formulaires modaux
  openNewAppointmentModal(): void {
    this.showAppointmentForm = true;
  }

  openNewPatientModal(): void {
    this.showPatientForm = true;
  }

  closeModals(): void {
    this.showAppointmentForm = false;
    this.showPatientForm = false;
  }

  submitAppointment(event: Event): void {
    event.preventDefault();
    alert('Rendez-vous enregistré avec succès !');
    this.closeModals();
  }

  submitPatient(event: Event): void {
    event.preventDefault();
    alert('Patient ajouté avec succès !');
    this.closeModals();
  }

  onImageError(event: any): void {
    event.target.src = 'https://via.placeholder.com/60x60?text=Erreur';
  }
}