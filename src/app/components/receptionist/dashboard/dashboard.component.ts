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
  // Méthode centrale pour garantir la cohérence de toutes les stats et listes
  private setTodayAppointmentsList(newList: any[]) {
    this.todayAppointmentsList = newList;
    this.recalculateTodayAppointmentsListWithLate();
    this.recalculateFilteredTodayAppointments();
  }
  isLoadingStats = true;
  isStatsUpdating = false; // Pour afficher le skeleton sur les stats
  private statsInterval: any = null;
  private recalculateTodayAppointmentsListWithLate() {
    const now = new Date();
    this.todayAppointmentsListWithLate = this.todayAppointmentsList.map(app => {
      if (app.status === 'finished') return app;
      const [h, m] = app.time.split(':').map(Number);
      const appDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
      if (app.status !== 'finished' && app.status !== 'late' && appDate < now) {
        return { ...app, status: 'late' };
      }
      if (app.status === 'late' && appDate >= now) {
        return { ...app, status: 'pending' };
      }
      return app;
    });
  }

  public recalculateFilteredTodayAppointments() {
    const search = this.appointmentSearch.trim().toLowerCase();
    if (!search) {
      this.filteredTodayAppointments = this.todayAppointmentsListWithLate;
    } else {
      this.filteredTodayAppointments = this.todayAppointmentsListWithLate.filter(a =>
        a.name.toLowerCase().includes(search) ||
        a.doctor.toLowerCase().includes(search) ||
        a.type.toLowerCase().includes(search)
      );
    }
  }

  public setAppointmentSearch(value: string) {
    this.appointmentSearch = value;
    this.recalculateFilteredTodayAppointments();
  }

  private updateAppointmentsLists() {
    this.recalculateTodayAppointmentsListWithLate();
    this.recalculateFilteredTodayAppointments();
  }


  ngOnInit(): void {
    // Simule un appel backend pour les stats (2s)
    this.isLoadingStats = true;
    setTimeout(() => {
      this.updateAppointmentsLists();
      this.isLoadingStats = false;
    }, 2000);

    // Simulation dynamique : toutes les 5s, on simule un changement dans les stats
    this.statsInterval = setInterval(() => {
      this.simulateStatsChange();
    }, 5000);
  }

  ngDoCheck(): void {
    this.recalculateFilteredTodayAppointments();
  }
  // Action : marquer comme terminé depuis la liste (utilisé dans le template)
  confirmPaymentFromList(appointment: any) {
    const newList = this.todayAppointmentsList.map(a =>
      a === appointment ? { ...a, status: 'finished', payment: true } : a
    );
    this.setTodayAppointmentsList(newList);
  }

  markPending(appointment: any) {
    const newList = this.todayAppointmentsList.map(a =>
      a.email === appointment.email &&
      a.time === appointment.time &&
      a.name === appointment.name &&
      a.doctor === appointment.doctor
        ? { ...a, status: 'pending' }
        : a
    );
    this.setTodayAppointmentsList(newList);
  }
  // Logique dynamique frontend pour stats et statuts
  appointmentSearch = '';
  selectedPendingPatient: any = null;
  showPaymentModal = false;
  paymentAmount = '';
  paymentMethod = 'Espèces';
  currentDate = new Date();
  renderedCharts = false;

  // Liste complète des rendez-vous du jour (15 patients pour la démo)
  todayAppointmentsList = [
    { initials: 'S', name: 'Selmer Murray', email: 'selmer.murray709@example.org', type: 'Consultation', doctor: 'Dr. Kamal Berrada', time: '08:30', status: 'finished', price: 300, payment: true, paymentMethod: 'Carte' },
    { initials: 'Z', name: 'Zechariah FARIS', email: 'zechariah.fritsch379@example.org', type: 'Contrôle', doctor: 'Dr. Imane Lahlou', time: '09:00', status: 'late', price: 250, payment: false },
    { initials: 'A', name: 'Amy Volkman', email: 'amy.volkman736@example.net', type: 'Consultation', doctor: 'Dr. Kamal Berrada', time: '09:15', status: 'pending', price: 350, payment: false },
    { initials: 'K', name: 'Kianna Schroeder', email: 'kianna.schroeder167@example.com', type: 'Consultation', doctor: 'Dr. Mehdi El Idrissi', time: '09:45', status: 'pending', price: 200, payment: false },
    { initials: 'P', name: 'Providenci Batz', email: 'providenci.batz246@example.com', type: 'Consultation', doctor: 'Dr. Kamal Berrada', time: '10:10', status: 'finished', price: 320, payment: true, paymentMethod: 'Espèces' },
    { initials: 'D', name: 'Dedrick Hintz', email: 'dedrick.hintz975@example.org', type: 'Contrôle', doctor: 'Dr. Imane Lahlou', time: '10:30', status: 'late', price: 210, payment: false },
    { initials: 'S', name: 'Shayna Friesen', email: 'shayna.friesen922@example.org', type: 'Consultation', doctor: 'Dr. Kamal Berrada', time: '10:50', status: 'pending', price: 400, payment: false },
    { initials: 'G', name: 'Grace Ledner', email: 'grace.ledner495@example.org', type: 'Consultation', doctor: 'Dr. Mehdi El Idrissi', time: '11:20', status: 'pending', price: 220, payment: false },
    { initials: 'A', name: 'Amparo Hamill', email: 'amparo.hamill457@example.org', type: 'Consultation', doctor: 'Dr. Kamal Berrada', time: '11:45', status: 'finished', price: 310, payment: true, paymentMethod: 'Chèque' },
    { initials: 'E', name: 'Eudora Kshlerin', email: 'eudora.kshlerin565@example.org', type: 'Contrôle', doctor: 'Dr. Imane Lahlou', time: '12:00', status: 'pending', price: 260, payment: false },
    { initials: 'V', name: 'Vincent Will', email: 'vincent.will807@example.org', type: 'Consultation', doctor: 'Dr. Kamal Berrada', time: '12:30', status: 'pending', price: 330, payment: false },
    { initials: 'J', name: 'Jazmin Krajcik', email: 'jazmin.krajcik@example.com', type: 'Consultation', doctor: 'Dr. Mehdi El Idrissi', time: '13:00', status: 'late', price: 210, payment: false },
    { initials: 'M', name: 'Mina Kihn', email: 'mina.kihn@example.com', type: 'Consultation', doctor: 'Dr. Kamal Berrada', time: '13:30', status: 'finished', price: 340, payment: true, paymentMethod: 'Espèces' },
    { initials: 'C', name: 'Carmelo Koss', email: 'carmelo.koss@example.com', type: 'Contrôle', doctor: 'Dr. Imane Lahlou', time: '14:00', status: 'pending', price: 270, payment: false },
    { initials: 'L', name: 'Laverna Kulas', email: 'laverna.kulas@example.com', type: 'Consultation', doctor: 'Dr. Kamal Berrada', time: '14:30', status: 'pending', price: 360, payment: false }
  ];

  todayAppointmentsListWithLate: any[] = [];
  filteredTodayAppointments: any[] = [];


// Stats dynamiques
get todayAppointments() {
  return this.todayAppointmentsListWithLate.length;
  // Simulation dynamique de changements dans les stats (ajout, passage en terminé, etc.)
}
get pendingPatients() {
  return this.todayAppointmentsListWithLate.filter(a => a.status === 'pending').length;
}
get finishedPatients() {
  return this.todayAppointmentsListWithLate.filter(a => a.status === 'finished').length;
}
get latePatients() {
  return this.todayAppointmentsListWithLate.filter(a => a.status === 'late').length;
}


// Liste des patients terminés pour le template
get finishedPatientsList() {
  return this.todayAppointmentsListWithLate.filter(a => a.status === 'finished');
}

  // ...existing code...

// ...existing code...
  // Pour la modale "patients en attente"
  get pendingPatientsList() {
    return this.todayAppointmentsListWithLate.filter(a => a.status === 'pending');
  }
  get latePatientsList() {
    return this.todayAppointmentsListWithLate.filter(a => a.status === 'late');
  }

  // Paiement : passage de pending à finished
  openPaymentModal(patient: any) {
    this.selectedPendingPatient = patient;
    this.paymentAmount = patient.price ? String(patient.price) : '';
    this.paymentMethod = 'Espèces';
    this.showPaymentModal = true;
  }
  closePaymentModal() {
    this.selectedPendingPatient = null;
    this.paymentAmount = '';
    this.paymentMethod = 'Espèces';
    this.showPaymentModal = false;
  }
  confirmPayment() {
    if (!this.selectedPendingPatient) return;
    const newList = this.todayAppointmentsList.map(a =>
      a === this.selectedPendingPatient
        ? { ...a, status: 'finished', payment: true, price: Number(this.paymentAmount), paymentMethod: this.paymentMethod }
        : a
    );
    this.setTodayAppointmentsList(newList);
    this.closePaymentModal();
  }

  get upcomingAppointments() {
    return this.todayAppointmentsList.filter(a => a.status === 'upcoming');
  }

  selectedStat: string | null = null;
  openStatModal(stat: string) {
    this.selectedStat = stat;
    this.appointmentSearch = '';
  }
  closeStatModal() {
    this.selectedStat = null;
    this.appointmentSearch = '';
  }

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


  ngOnDestroy(): void {
    // Nettoyer l'intervalle de simulation
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
      this.statsInterval = null;
    }
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

  // Simulation dynamique de changements dans les stats (ajout, passage en terminé, etc.)
  simulateStatsChange() {
    this.isStatsUpdating = true;
    setTimeout(() => {
      const actions = ['add', 'finish', 'late', 'pending'];
      const action = actions[Math.floor(Math.random() * actions.length)];
      let newList = [...this.todayAppointmentsList];
      if (action === 'add') {
        const names = ['Nora', 'Yassine', 'Fatima', 'Omar', 'Lina', 'Sami', 'Imane', 'Walid'];
        const doctors = ['Dr. Kamal Berrada', 'Dr. Imane Lahlou', 'Dr. Mehdi El Idrissi'];
        const name = names[Math.floor(Math.random() * names.length)] + ' ' + String.fromCharCode(65 + Math.floor(Math.random() * 26)) + '.';
        const email = name.toLowerCase().replace(/ /g, '.') + Math.floor(Math.random() * 1000) + '@example.com';
        const doctor = doctors[Math.floor(Math.random() * doctors.length)];
        const time = (8 + Math.floor(Math.random() * 8)) + ':' + (Math.random() > 0.5 ? '30' : '00');
        const price = 200 + Math.floor(Math.random() * 200);
        newList.push({
          initials: name[0],
          name,
          email,
          type: 'Consultation',
          doctor,
          time,
          status: 'pending',
          price,
          payment: false
        });
      } else if (action === 'finish') {
        const candidates = newList.filter(a => a.status === 'pending' || a.status === 'late');
        if (candidates.length > 0) {
          const idx = newList.indexOf(candidates[Math.floor(Math.random() * candidates.length)]);
          if (idx !== -1) {
            newList[idx] = { ...newList[idx], status: 'finished', payment: true, paymentMethod: 'Espèces' };
          }
        }
      } else if (action === 'late') {
        const candidates = newList.filter(a => a.status === 'pending');
        if (candidates.length > 0) {
          const idx = newList.indexOf(candidates[Math.floor(Math.random() * candidates.length)]);
          if (idx !== -1) {
            newList[idx] = { ...newList[idx], status: 'late' };
          }
        }
      } else if (action === 'pending') {
        const candidates = newList.filter(a => a.status === 'late');
        if (candidates.length > 0) {
          const idx = newList.indexOf(candidates[Math.floor(Math.random() * candidates.length)]);
          if (idx !== -1) {
            newList[idx] = { ...newList[idx], status: 'pending' };
          }
        }
      }
      this.setTodayAppointmentsList(newList);
      this.isStatsUpdating = false;
    }, 800);
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
  getStatValue(statType: string): number {
  switch (statType) {
    case 'today': return this.todayAppointments;
    case 'pending': return this.pendingPatients;
    case 'finished': return this.finishedPatients;
    case 'late': return this.latePatients;
    default: return 0;
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