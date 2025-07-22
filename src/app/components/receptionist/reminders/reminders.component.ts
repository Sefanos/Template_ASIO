
import { Component } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface ReminderLog {
  id: number;
  timestamp: string;
  patientName: string;
  appointmentType: string;
  status: 'sent' | 'failed' | 'delivered' | 'opened';
  channel: 'SMS' | 'Email';
}

@Component({
  selector: 'app-reminders',
  templateUrl: './reminders.component.html',
  styleUrls: ['./reminders.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe]
})
export class RemindersComponent {
  isLoading = true;

  // Données statiques avec vos vrais patients
  stats = {
    scheduled: 38,
    sent: 112,
    pending: 9,
    cancelled: 2
  };

  settings = {
    sms_enabled: true,
    email_enabled: true,
    reminder_time: '1h',
    excluded_days: ['Samedi', 'Dimanche']
  };

  // Liste des patients réels que vous avez fournis
  realPatients = [
    'Selmer Murrayy',
    'Zechariah FARISs',
    'Amy ndarrz',
    'Kianna Schroeder',
    'Providenci Batz',
    'Dedrick Hintz'
  ];

  // Types de rendez-vous
  appointmentTypes = ['Consultation', 'Suivi', 'Urgence', 'Vaccination', 'Rééducation'];

  // Générer des logs aléatoires mais cohérents
  logs: ReminderLog[] = [];

  analytics = {
    delivery_rate: 96,
    open_rate: 78,
    response_rate: 45,
    no_show_reduction: 32
  };

  // Pagination
  currentPage = 1;
  itemsPerPage = 5;
  totalItems = 0;

  // Modals
  testModalOpen = false;
  showAnalytics = false;

  // Test form
  testPatientName = '';
  testEmail = '';
  testPhone = '';
  testChannel = '';

  // Autocomplétion
  allPatients = [
    { name: 'Selmer Murrayy', email: 'selmer.murrayy@email.com', phone: '+216 20 123 456' },
    { name: 'Zechariah FARISs', email: 'zechariah.faris@email.com', phone: '+216 21 234 567' },
    { name: 'Amy ndarrz', email: 'amy.ndarrz@email.com', phone: '+216 22 345 678' },
    { name: 'Kianna Schroeder', email: 'kianna.schroeder@email.com', phone: '+216 23 456 789' },
    { name: 'Providenci Batz', email: 'providenci.batz@email.com', phone: '+216 24 567 890' },
    { name: 'Dedrick Hintz', email: 'dedrick.hintz@email.com', phone: '+216 25 678 901' }
  ];
  filteredPatients: { name: string; email: string; phone: string }[] = [];
  highlightedIndex = -1;

  constructor() {
    this.loadReminders();
  }

  loadReminders() {
    this.isLoading = true;
    setTimeout(() => {
      // Simule la récupération des données du backend
      this.logs = this.generateLogs(15);
      this.totalItems = this.logs.length;
      this.stats = {
        scheduled: 38,
        sent: 112,
        pending: 9,
        cancelled: 2
      };
      this.analytics = {
        delivery_rate: 96,
        open_rate: 78,
        response_rate: 45,
        no_show_reduction: 32
      };
      this.isLoading = false;
    }, 1500); // 1.5s de chargement simulé
  }

  generateLogs(count: number): ReminderLog[] {
    const logs: ReminderLog[] = [];
    for (let i = 0; i < count; i++) {
      const now = new Date();
      now.setHours(now.getHours() - Math.floor(Math.random() * 72)); // Jusqu’à 3 jours en arrière

      logs.push({
        id: i + 1,
        timestamp: now.toISOString(),
        patientName: this.realPatients[Math.floor(Math.random() * this.realPatients.length)],
        appointmentType: this.appointmentTypes[Math.floor(Math.random() * this.appointmentTypes.length)],
        status: ['sent', 'delivered', 'opened', 'failed'][Math.floor(Math.random() * 4)] as any,
        channel: Math.random() > 0.3 ? 'SMS' : 'Email'
      });
    }
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  getMin(a: number, b: number): number {
    return a < b ? a : b;
  }

  onPatientSearch(): void {
    const query = this.testPatientName?.trim().toLowerCase();
    if (!query) {
      this.filteredPatients = [];
      return;
    }
    this.filteredPatients = this.allPatients.filter(
      patient => patient.name.toLowerCase().includes(query)
    );
    this.highlightedIndex = -1; // Réinitialiser la surbrillance
  }

  selectPatient(patient: { name: string; email: string; phone: string }): void {
    this.testPatientName = patient.name;
    this.testEmail = patient.email;
    this.testPhone = patient.phone;
    this.filteredPatients = []; // Cacher la liste
  }

  onKeydown(event: KeyboardEvent): void {
    if (this.filteredPatients.length === 0) return;
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.highlightedIndex = (this.highlightedIndex + 1) % this.filteredPatients.length;
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.highlightedIndex = this.highlightedIndex <= 0 ? this.filteredPatients.length - 1 : this.highlightedIndex - 1;
        break;
      case 'Enter':
        event.preventDefault();
        if (this.highlightedIndex >= 0) {
          this.selectPatient(this.filteredPatients[this.highlightedIndex]);
        }
        break;
      case 'Escape':
        this.filteredPatients = [];
        break;
    }
  }

  saveSettings() {
    this.showToast('Paramètres sauvegardés avec succès', 'success');
  }

  scheduleAllReminders() {
    this.showToast('Tous les rappels ont été planifiés', 'success');
  }

  cancelAllReminders() {
    if (confirm('Êtes-vous sûr de vouloir annuler tous les rappels ?')) {
      this.showToast('Tous les rappels ont été annulés', 'warning');
    }
  }

  openTestModal() {
    this.testPatientName = '';
    this.testEmail = '';
    this.testPhone = '';
    this.testChannel = '';
    this.filteredPatients = [];
    this.highlightedIndex = -1;
    this.testModalOpen = true;
  }

  closeTestModal() {
    this.testModalOpen = false;
  }

  sendTestReminder() {
    this.closeTestModal();
    this.showToast(`Rappel de test envoyé par ${this.testChannel}`, 'success');
  }

  addExcludedDay() {
    const newDay = prompt('Jour à exclure (ex: Lundi)');
    if (newDay && !this.settings.excluded_days.includes(newDay)) {
      this.settings.excluded_days.push(newDay);
    }
  }

  removeExcludedDay(day: string) {
    this.settings.excluded_days = this.settings.excluded_days.filter(d => d !== day);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'sent': return 'bg-blue-100 text-blue-700';
      case 'delivered': return 'bg-green-100 text-green-700';
      case 'opened': return 'bg-indigo-100 text-indigo-700';
      case 'failed': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  }

  previousPage() {
    if (this.currentPage > 1) this.currentPage--;
  }

  nextPage() {
    if (this.currentPage < this.totalPages) this.currentPage++;
  }

  showToast(message: string, type: 'success' | 'warning' | 'error') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 text-white font-medium animate-fade-in`;
    notification.style.animation = 'fadeIn 0.3s ease-out';

    switch (type) {
      case 'success':
        notification.classList.add('bg-green-600');
        break;
      case 'warning':
        notification.classList.add('bg-yellow-600');
        break;
      case 'error':
        notification.classList.add('bg-red-600');
        break;
    }

    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      document.body.removeChild(notification);
    }, 3000);
  }
}