import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-bills',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bills.component.html',
  styleUrls: ['./bills.component.css']
})
export class BillsComponent {
  searchQuery = '';
  selectedDate = '';
  Math = Math; // Pour utiliser Math dans le template

  invoices = [
    { id: 1, patientName: 'Kamal Benali', amount: 120, date: '2025-04-01', description: 'Consultation générale + examens de routine' },
    { id: 2, patientName: 'Walid Mansouri', amount: 80, date: '2025-04-05', description: 'Bilan sanguin complet' },
    { id: 3, patientName: 'Imane Chakir', amount: 200, date: '2025-04-03', description: 'Soins intensifs et surveillance médicale' },
    { id: 4, patientName: 'Ahmed Tazi', amount: 150, date: '2025-04-02', description: 'Radiographie thoracique et consultation' },
    { id: 5, patientName: 'Sana El Amrani', amount: 90, date: '2025-04-06', description: 'Suivi médical post-opératoire' },
    { id: 6, patientName: 'Omar Benzakour', amount: 250, date: '2025-04-07', description: 'Intervention chirurgicale mineure' },
    { id: 7, patientName: 'Fatima Alaoui', amount: 65, date: '2025-04-08', description: 'Consultation de contrôle' }
  ];

  showModal = false;
  modalMode: 'add' | 'edit' | 'view' = 'add';
  selectedInvoice: any = null;
  newInvoice: any = {
    id: null,
    patientName: '',
    amount: null,
    date: '',
    description: ''
  };

  // Pagination
  itemsPerPage = 5;
  currentPage = 1;
  constructor() {}

  get filteredInvoices() {
    return this.invoices.filter(invoice => {
      const matchesSearch = this.searchQuery
        ? invoice.patientName.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          ('' + invoice.id).toLowerCase().includes(this.searchQuery.toLowerCase())
        : true;

      const matchesDate = this.selectedDate
        ? invoice.date === this.selectedDate
        : true;

      return matchesSearch && matchesDate;
    });
  }

  get totalPages(): number {
    return Math.ceil(this.filteredInvoices.length / this.itemsPerPage);
  }

  get paginatedInvoices() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredInvoices.slice(start, end);
  }

  getPagesArray(): number[] {
    return Array(this.totalPages).fill(0).map((_, i) => i);
  }

  // ✅ Nouvelles méthodes pour les statistiques
  getTotalAmount(): number {
    return this.invoices.reduce((total, invoice) => total + invoice.amount, 0);
  }

  getAverageAmount(): number {
    if (this.invoices.length === 0) return 0;
    return this.getTotalAmount() / this.invoices.length;
  }
  // ✅ Méthode pour les couleurs selon le montant
  getAmountColorClass(amount: number): string {
    if (amount > 200) return 'bg-red-50 text-red-700';
    if (amount > 100) return 'bg-yellow-50 text-yellow-700';
    return 'bg-green-50 text-green-700';
  }

  // ✅ Méthode pour réinitialiser les filtres
  clearFilters(): void {
    this.searchQuery = '';
    this.selectedDate = '';
    this.currentPage = 1;
  }

  openAddModal() {
    this.modalMode = 'add';
    this.newInvoice = {
      id: null,
      patientName: '',
      amount: null,
      date: new Date().toISOString().split('T')[0], // Date du jour par défaut
      description: ''
    };
    this.showModal = true;
  }

  openEditModal(invoice: any) {
    this.modalMode = 'edit';
    this.newInvoice = { ...invoice };
    this.showModal = true;
  }

  openViewModal(invoice: any) {
    this.modalMode = 'view';
    this.selectedInvoice = invoice;
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.selectedInvoice = null;
  }

  saveInvoice() {
    if (!this.newInvoice.patientName || !this.newInvoice.amount || !this.newInvoice.date) {
      alert('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    
    if (this.modalMode === 'add') {
      const newId = this.invoices.length ? Math.max(...this.invoices.map(i => i.id)) + 1 : 1;
      this.newInvoice.id = newId;
      this.invoices.unshift({ ...this.newInvoice }); // Ajouter en début de liste
    } else if (this.modalMode === 'edit') {
      const idx = this.invoices.findIndex(i => i.id === this.newInvoice.id);
      if (idx !== -1) this.invoices[idx] = { ...this.newInvoice };
    }
    
    this.closeModal();
  }

  deleteInvoice(invoice: any) {
    if (confirm(`Êtes-vous sûr de vouloir supprimer la facture #${invoice.id} de ${invoice.patientName} ?`)) {
      this.invoices = this.invoices.filter(i => i.id !== invoice.id);
      
      // Ajuster la page courante si nécessaire
      if (this.paginatedInvoices.length === 0 && this.currentPage > 1) {
        this.currentPage--;
      }
    }
  }
}