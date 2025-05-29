import { Component, AfterViewInit } from '@angular/core';
import { NgFor, NgIf, NgClass } from '@angular/common';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  imports: [NgFor, NgIf, NgClass]
})
export class DashboardComponent implements AfterViewInit {

  todayAppointments = 12;
  pendingPatients = 3;
  finishedPatients = 25;
  latePatients = 7;

  // Liste complète des rendez-vous du jour
  todayAppointmentsList = [
    {
      initials: 'SM',
      name: 'Salwa Slimani',
      type: 'Consultation',
      doctor: 'Dr. Kamal',
      time: '09:00',
      status: 'completed'
    },
    {
      initials: 'MH',
      name: 'Mohamed Hariri',
      type: 'Contrôle',
      doctor: 'Dr. Kamal',
      time: '10:30',
      status: 'upcoming'
    },
    {
      initials: 'FA',
      name: 'Fatima Amrani',
      type: 'Consultation',
      doctor: 'Dr. Kamal',
      time: '11:15',
      status: 'late'
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

  ngAfterViewInit(): void {
    this.initRdvChart();
    this.initGenderChart();
    this.initAgeChart();
    this.initWeeklyOverviewChart();
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'completed': return 'Terminé';
      case 'upcoming': return 'À venir';
      case 'late': return 'En retard';
      default: return status;
    }
  }

  // Graphiques (tu peux garder ou adapter ces méthodes selon ton besoin)
  initRdvChart() {
    const ctx = document.getElementById('appointments-chart') as HTMLCanvasElement;
    if (!ctx) return;
    new Chart(ctx, {
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
          x: { grid: { display: false } },
          y: { beginAtZero: true, grid: { color: '#e5e7eb' } }
        },
        plugins: {
          legend: { display: false }
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
        labels: ['Women', 'Men'],
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
            callbacks: {
              label: (context) => `${context.label}: ${context.raw}%`
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: { stepSize: 10 },
            grid: { color: '#e5e7eb' }
          },
          y: { grid: { display: false } }
        }
      }
    });
  }

  initWeeklyOverviewChart() {
    const weeklyCtx = document.getElementById('weekly-overview-chart') as HTMLCanvasElement;
    if (!weeklyCtx) return;
    new Chart(weeklyCtx, {
      type: 'bar',
      data: {
        labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
        datasets: [{
          label: 'Rendez-vous',
          data: [6, 7, 5, 8, 6, 4, 3],
          backgroundColor: '#3b82f6',
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
            callbacks: {
              label: (context) => `${context.label}: ${context.raw} RDV`
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: { stepSize: 1 },
            grid: { display: false }
          },
          y: { grid: { color: '#e5e7eb' } }
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