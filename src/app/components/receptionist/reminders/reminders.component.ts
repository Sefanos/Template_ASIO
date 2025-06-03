import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-reminders',
  templateUrl: './reminders.component.html',
  styleUrls: ['./reminders.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class RemindersComponent {
  reminders = [
    {
      id: 1,
      patientName: 'Kamal Berrada',
      message: 'Rappel : RDV demain à 10h.',
      date: new Date('2025-06-05'),
      status: 'envoyé'
    },
    {
      id: 2,
      patientName: 'Imane Tahri',
      message: 'Votre suivi est programmé la semaine prochaine.',
      date: new Date('2025-06-03'),
      status: 'en attente'
    },
    {
      id: 3,
      patientName: 'Sana Slimani',
      message: 'Nouvelle consultation prévue bientôt.',
      date: new Date('2025-06-02'),
      status: 'non lu'
    }
  ];

  showModal = false;
  modalMode: 'add' | 'edit' | 'view' = 'add';
  selectedReminder: any = null;
  newReminder: any = {
    id: null,
    patientName: '',
    message: '',
    date: '',
    status: 'en attente'
  };

  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'envoyé':
        return 'bg-green-100 text-green-700';
      case 'en attente':
        return 'bg-yellow-100 text-yellow-700';
      case 'non lu':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  }

  openAddModal() {
    this.modalMode = 'add';
    this.newReminder = {
      id: null,
      patientName: '',
      message: '',
      date: '',
      status: 'en attente'
    };
    this.showModal = true;
  }

  openEditModal(reminder: any) {
    this.modalMode = 'edit';
    this.newReminder = { ...reminder };
    this.showModal = true;
  }

  openViewModal(reminder: any) {
    this.modalMode = 'view';
    this.selectedReminder = reminder;
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.selectedReminder = null;
  }

  saveReminder() {
    if (!this.newReminder.patientName || !this.newReminder.message || !this.newReminder.date) {
      alert('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    if (this.modalMode === 'add') {
      const newId = this.reminders.length ? Math.max(...this.reminders.map(r => r.id)) + 1 : 1;
      this.newReminder.id = newId;
      this.reminders.push({ ...this.newReminder });
    } else if (this.modalMode === 'edit') {
      const idx = this.reminders.findIndex(r => r.id === this.newReminder.id);
      if (idx !== -1) this.reminders[idx] = { ...this.newReminder };
    }
    this.closeModal();
  }

  deleteReminder(reminder: any) {
    if (confirm(`Supprimer le rappel pour ${reminder.patientName} ?`)) {
      this.reminders = this.reminders.filter(r => r.id !== reminder.id);
    }
  }
  constructor() {}
}