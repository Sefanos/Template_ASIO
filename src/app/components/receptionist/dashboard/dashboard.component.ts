import { Component, AfterViewInit, OnInit, OnDestroy } from '@angular/core';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { CommonModule, registerLocaleData } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Chart from 'chart.js/auto';
import localeFr from '@angular/common/locales/fr';

import { ThemeService } from '../../../services/theme.service';
import { Subscription } from 'rxjs';


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

  
  isDarkMode = false;
  private themeSubscription: Subscription | null = null;
  
  constructor(private themeService: ThemeService) {}
  
  ngOnInit(): void {
    this.themeSubscription = this.themeService.darkMode$.subscribe(isDark => {
      this.isDarkMode = isDark;
      // Si les graphiques sont déjà initialisés, recréez-les avec le nouveau thème
      if (this.renderedCharts) {
        this.refreshChartsWithTheme();
      }
    });
  }
  
  ngOnDestroy(): void {
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe();
    }
  }
    // Garder une référence aux graphiques pour pouvoir les mettre à jour
  private renderedCharts = false;
  private demographicChart: Chart | null = null;
  private weeklyOverviewChart: Chart | null = null;
  private rdvChart: Chart | null = null;
  
  // Méthode pour rafraîchir les graphiques lorsque le thème change  
  refreshChartsWithTheme(): void {
    // Mettre à jour les graphiques qui utilisent les couleurs du thème
    this.renderDemographicChart();
    this.initWeeklyOverviewChart();
    this.initRdvChart();
    this.initGenderChart();
    this.initAgeChart();
    this.initPatientsLineChart();
    // Les autres graphiques ne sont pas affectés par le changement de thème
  }


  // Liste complète des rendez-vous du jour
  todayAppointmentsList = [
    {
      initials: 'SM',      name: 'Salwa Slimani',
      type: 'Consultation',
      doctor: 'Dr. Kamal Berrada',
      time: '09:00',
      status: 'completed',
      photo: 'assets/receptionist/images/FE.jpg'
    },
    {
      initials: 'MH',      name: 'Mohamed Hariri',
      type: 'Contrôle',
      doctor: 'Dr. Kamal Berrada',
      time: '10:30',
      status: 'upcoming',
      photo: 'assets/receptionist/images/eps3.jpg'
    },
    {
      initials: 'FA',      name: 'Fatima Amrani',
      type: 'Consultation',
      doctor: 'Dr. Kamal Berrada',
      time: '11:15',
      status: 'late',
      photo: 'assets/receptionist/images/eps1.jpg'
    },
    // Nouveau patient ajouté
    {
      initials: 'AA',      name: 'Adam AbouAli',
      type: 'Consultation',
      doctor: 'Dr. Kamal Berrada',
      time: '12:00',
      status: 'upcoming',
      photo: 'assets/receptionist/images/P4.jpg'
    }
  ];

  // Getter pour n'afficher que les rendez-vous à venir
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

  userName = 'Omar Bennani'; // Ou récupère dynamiquement selon le contexte

  demographicFilter: 'age' | 'gender' = 'age';

  ngAfterViewInit(): void {
    this.initRdvChart();
    this.initGenderChart();
    this.initAgeChart();
    this.initWeeklyOverviewChart();
    this.renderDemographicChart();
    this.initPatientsLineChart();

    
    // Marquer que les graphiques ont été rendus
    this.renderedCharts = true;

  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'completed': return 'Terminé';
      case 'upcoming': return 'À venir';
      case 'late': return 'En retard';
      default: return status;
    }
  }

  // Graphiques
  initRdvChart(): void {
    const ctx = document.getElementById('appointments-chart') as HTMLCanvasElement;
    if (!ctx) return;
    
    // Si un graphique existait déjà, le détruire
    if (this.rdvChart) {
      this.rdvChart.destroy();
    }
    
    this.rdvChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven'],
        datasets: [{
          label: 'Nombre de RDV',
          data: [5, 7, 3, 6, 4],
          backgroundColor: this.isDarkMode ? '#3b82f6aa' : '#3b82f6',
          hoverBackgroundColor: this.isDarkMode ? '#2563ebcc' : '#2563eb',
          borderRadius: 10
        }]
      },
      options: {
        responsive: true,
        scales: {
          x: { 
            grid: { display: false },
            ticks: { color: this.isDarkMode ? '#94a3b8' : '#64748b' }
          },
          y: { 
            beginAtZero: true, 
            grid: { color: this.isDarkMode ? '#334155' : '#e5e7eb' },
            ticks: { color: this.isDarkMode ? '#94a3b8' : '#64748b' }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: this.isDarkMode ? 'rgba(30,41,59,0.95)' : 'rgba(255,255,255,0.95)',
            titleColor: this.isDarkMode ? '#3b82f6' : '#2563eb',
            bodyColor: this.isDarkMode ? '#cbd5e1' : '#334155',
            borderColor: this.isDarkMode ? '#3b82f6' : '#2563eb',
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
            backgroundColor: this.isDarkMode ? 'rgba(30,41,59,0.95)' : 'rgba(255,255,255,0.95)',
            titleColor: this.isDarkMode ? '#3b82f6' : '#2563eb',
            bodyColor: this.isDarkMode ? '#cbd5e1' : '#334155',
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
            backgroundColor: this.isDarkMode ? 'rgba(30,41,59,0.95)' : 'rgba(255,255,255,0.95)',
            titleColor: this.isDarkMode ? '#3b82f6' : '#2563eb',
            bodyColor: this.isDarkMode ? '#cbd5e1' : '#334155',
            callbacks: {
              label: (context) => `${context.label}: ${context.raw}%`
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: { 
              stepSize: 10,
              color: this.isDarkMode ? '#94a3b8' : '#64748b'
            },
            grid: { color: this.isDarkMode ? '#334155' : '#e5e7eb' }
          },
          y: { 
            grid: { display: false },
            ticks: { color: this.isDarkMode ? '#94a3b8' : '#64748b' }
          }
        }
      }
    });
  }
  initWeeklyOverviewChart() {
    const weeklyCtx = document.getElementById('weekly-overview-chart') as HTMLCanvasElement;
    if (!weeklyCtx) return;
    
    // Si un graphique existait déjà, le détruire
    if (this.weeklyOverviewChart) {
      this.weeklyOverviewChart.destroy();
    }
    
    this.weeklyOverviewChart = new Chart(weeklyCtx, {
      type: 'bar',
      data: {
        labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
        datasets: [{
          label: 'Rendez-vous',
          data: [6, 7, 5, 8, 6, 4, 3],
          backgroundColor: this.isDarkMode ? '#3b82f6aa' : '#3b82f6',
          borderRadius: 5,
          barPercentage: 0.6,
          categoryPercentage: 0.7
        }]
      },
      options: {
        indexAxis: 'x',
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: this.isDarkMode ? 'rgba(30,41,59,0.95)' : 'rgba(255,255,255,0.95)',
            titleColor: this.isDarkMode ? '#3b82f6' : '#2563eb',
            bodyColor: this.isDarkMode ? '#cbd5e1' : '#334155',
            borderColor: this.isDarkMode ? '#3b82f6' : '#2563eb',
            borderWidth: 1,
            callbacks: {
              label: (context) => `${context.label}: ${context.raw} RDV`
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: { 
              stepSize: 1,
              color: this.isDarkMode ? '#94a3b8' : '#64748b'
            },
            grid: { display: false }
          },
          y: { 
            grid: { color: this.isDarkMode ? '#334155' : '#e5e7eb' },
            ticks: { color: this.isDarkMode ? '#94a3b8' : '#64748b' }
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
      // Définir la fonction createGradient avant son utilisation
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
      // Couleurs modernes avec dégradés
      backgroundColors = [
        createGradient(ctx, ['#3b82f6', '#1d4ed8']), // bleu
        createGradient(ctx, ['#10b981', '#059669']), // vert
        createGradient(ctx, ['#f59e0b', '#d97706']), // ambre
        createGradient(ctx, ['#8b5cf6', '#6d28d9']), // violet
        createGradient(ctx, ['#ef4444', '#b91c1c'])  // rouge
      ];
      hoverBackgroundColors = [
        createGradient(ctx, ['#60a5fa', '#2563eb']), // bleu hover
        createGradient(ctx, ['#34d399', '#059669']), // vert hover
        createGradient(ctx, ['#fbbf24', '#d97706']), // ambre hover
        createGradient(ctx, ['#a78bfa', '#7c3aed']), // violet hover
        createGradient(ctx, ['#f87171', '#dc2626'])  // rouge hover
      ];
    } else {
      labels = ['Femmes', 'Hommes'];
      data = [40, 60];
      backgroundColors = [
        createGradient(ctx, ['#3b82f6', '#1d4ed8']), // bleu
        createGradient(ctx, ['#f59e0b', '#d97706'])  // ambre
      ];
      hoverBackgroundColors = [
        createGradient(ctx, ['#60a5fa', '#2563eb']), // bleu hover
        createGradient(ctx, ['#fbbf24', '#d97706'])  // ambre hover
      ];
    }
    
    if (this.demographicChart) this.demographicChart.destroy();
      // Crée une ombre pour le graphique
    const shadowPlugin = {
      id: 'shadowPlugin',
      beforeDraw: (chart: any) => {
        const { ctx, width, height } = chart;
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
          legend: { 
            display: false
          },
          tooltip: {
            enabled: true,
            backgroundColor: 'rgba(255,255,255,0.98)',
            titleColor: '#1e40af',
            bodyColor: '#1f2937',
            borderColor: 'rgba(99, 102, 241, 0.3)',
            borderWidth: 2,
            cornerRadius: 8,
            boxPadding: 8,
            padding: {
              top: 12,
              bottom: 12,
              left: 16,
              right: 16
            },
            titleFont: {
              size: 14,
              weight: 'bold',
            },
            bodyFont: {
              size: 14
            },
            displayColors: true,
            callbacks: {
              title: (tooltipItems: any) => {
                return tooltipItems[0].label;
              },
              label: (context: any) => {
                return ` ${context.parsed} % du total`;
              },
              labelTextColor: () => {
                return '#334155';
              }
            }
          },
        },
        layout: { 
          padding: {
            top: 24,
            bottom: 24,
            left: 20,
            right: 20
          }
        },
        animation: {
          animateScale: true,
          animateRotate: true,
          duration: 1800,
          easing: 'easeOutCirc',
          delay: (context) => {
            // Délai par segment pour un effet en cascade
            return context.dataIndex * 150;
          }
        },
        responsive: true,
        maintainAspectRatio: false,
      },      plugins: [shadowPlugin]
    });
  }
  initPatientsLineChart() {
    const ctx = document.getElementById('patients-line-chart') as HTMLCanvasElement;
    if (!ctx) return;
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'],
        datasets: [
          {
            label: 'Hommes',
            data: [12, 14, 13, 16, 18, 17, 19, 20, 18, 17, 16, 15],
            borderColor: this.isDarkMode ? '#3b82f6' : '#2563eb',
            backgroundColor: this.isDarkMode ? 'rgba(59,130,246,0.12)' : 'rgba(59,130,246,0.08)',
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            borderWidth: 3
          },
          {
            label: 'Femmes',
            data: [10, 12, 11, 13, 15, 14, 16, 19, 17, 16, 15, 14],
            borderColor: this.isDarkMode ? '#60a5fa' : '#3b82f6',
            backgroundColor: this.isDarkMode ? 'rgba(96,165,250,0.12)' : 'rgba(96,165,250,0.08)',
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
            backgroundColor: this.isDarkMode ? 'rgba(30,41,59,0.95)' : 'rgba(255,255,255,0.95)',
            titleColor: this.isDarkMode ? '#3b82f6' : '#2563eb',
            bodyColor: this.isDarkMode ? '#cbd5e1' : '#334155',
            borderColor: this.isDarkMode ? '#3b82f6' : '#2563eb',
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
            ticks: { 
              color: this.isDarkMode ? '#94a3b8' : '#64748b', 
              font: { weight: 'bold', size: 14 } 
            }
          },
          y: {
            beginAtZero: true,
            grid: { color: this.isDarkMode ? '#334155' : '#e0e7ef' },
            ticks: { 
              color: this.isDarkMode ? '#94a3b8' : '#64748b', 
              font: { size: 13 } 
            }
          }
        },
        animation: {
          duration: 1200,
          easing: 'easeOutQuart'
        }
      }
    });
  }
  renderDemographicChart() {
    const ctx = document.getElementById('demographic-chart') as HTMLCanvasElement;
    if (!ctx) return;
    let data, labels;
    let backgroundColors, hoverBackgroundColors;
      // Définir la fonction createGradient avant son utilisation
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
      // Couleurs modernes avec dégradés
      backgroundColors = [
        createGradient(ctx, ['#3b82f6', '#1d4ed8']), // bleu
        createGradient(ctx, ['#10b981', '#059669']), // vert
        createGradient(ctx, ['#f59e0b', '#d97706']), // ambre
        createGradient(ctx, ['#8b5cf6', '#6d28d9']), // violet
        createGradient(ctx, ['#ef4444', '#b91c1c'])  // rouge
      ];
      hoverBackgroundColors = [
        createGradient(ctx, ['#60a5fa', '#2563eb']), // bleu hover
        createGradient(ctx, ['#34d399', '#059669']), // vert hover
        createGradient(ctx, ['#fbbf24', '#d97706']), // ambre hover
        createGradient(ctx, ['#a78bfa', '#7c3aed']), // violet hover
        createGradient(ctx, ['#f87171', '#dc2626'])  // rouge hover
      ];
    } else {
      labels = ['Femmes', 'Hommes'];
      data = [40, 60];
      backgroundColors = [
        createGradient(ctx, ['#3b82f6', '#1d4ed8']), // bleu
        createGradient(ctx, ['#f59e0b', '#d97706'])  // ambre
      ];
      hoverBackgroundColors = [
        createGradient(ctx, ['#60a5fa', '#2563eb']), // bleu hover
        createGradient(ctx, ['#fbbf24', '#d97706'])  // ambre hover
      ];
    }
    
    if (this.demographicChart) this.demographicChart.destroy();
      // Crée une ombre pour le graphique
    const shadowPlugin = {
      id: 'shadowPlugin',
      beforeDraw: (chart: any) => {
        const { ctx, width, height } = chart;
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
          legend: { 
            display: false
          },
          tooltip: {
            enabled: true,
            backgroundColor: 'rgba(255,255,255,0.98)',
            titleColor: '#1e40af',
            bodyColor: '#1f2937',
            borderColor: 'rgba(99, 102, 241, 0.3)',
            borderWidth: 2,
            cornerRadius: 8,
            boxPadding: 8,
            padding: {
              top: 12,
              bottom: 12,
              left: 16,
              right: 16
            },
            titleFont: {
              size: 14,
              weight: 'bold',
            },
            bodyFont: {
              size: 14
            },
            displayColors: true,
            callbacks: {
              title: (tooltipItems: any) => {
                return tooltipItems[0].label;
              },
              label: (context: any) => {
                return ` ${context.parsed} % du total`;
              },
              labelTextColor: () => {
                return '#334155';
              }
            }
          },
        },
        layout: { 
          padding: {
            top: 24,
            bottom: 24,
            left: 20,
            right: 20
          }
        },
        animation: {
          animateScale: true,
          animateRotate: true,
          duration: 1800,
          easing: 'easeOutCirc',
          delay: (context) => {
            // Délai par segment pour un effet en cascade
            return context.dataIndex * 150;
          }
        },
        responsive: true,
        maintainAspectRatio: false,
      },      plugins: [shadowPlugin]
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

  // Gestion des erreurs d'image
  onImageError(event: any): void {
    event.target.src = 'https://via.placeholder.com/60x60?text=Erreur';
  }
}