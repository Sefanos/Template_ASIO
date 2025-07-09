import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { Bill, Pagination } from '../../../models/bill.model';
import { BillService, BillFilters, CreateBillRequest, CreateBillItem, UpdateBillRequest, AddItemRequest } from '../../../services/bill.service';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-bills',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './bills.component.html',
  styleUrls: ['./bills.component.css'],
  providers: [BillService]
})
export class BillsComponent implements OnInit {
  bills: Bill[] = [];
  pagination: Pagination | null = null;
  isLoading = false;
  selectedBill: Bill | null = null;
  showCreateModal = false;
  isCreating = false;
  
  // Nouvelles propriétés pour les fonctionnalités
  showEditModal = false;
  isUpdating = false;
  showAddItemModal = false;
  isAddingItem = false;
  billToEdit: Bill | null = null;
  billToAddItem: Bill | null = null;
  
  // Référence à Math pour l'utilisation dans le template
  Math = Math;
  
  // Filtres
  filters: BillFilters = {
    page: 1,
    per_page: 15
  };
  
  // Champs de filtre pour le template
  patientIdFilter = '';
  doctorNameFilter = '';
  paymentMethodFilter = '';
  presetPeriodFilter = '';

  // Formulaire de création de facture
  newBill: CreateBillRequest = {
    patient_id: 0,
    doctor_user_id: 0,
    issue_date: new Date().toISOString().split('T')[0],
    payment_method: '',
    description: '',
    items: []
  };

  // Formulaire de modification de facture
  editBill: UpdateBillRequest = {
    payment_method: '',
    description: '',
    items: []
  };

  // Nouvel item en cours d'ajout
  newItem: CreateBillItem = {
    service_type: '',
    description: '',
    price: 0
  };

  // Item à ajouter à une facture existante
  newItemToAdd: AddItemRequest = {
    service_type: '',
    description: '',
    price: 0
  };

  // Options pour les types de services
  serviceTypes = [
    'Consultation Générale',
    'Consultation Spécialisée',
    'Analyse Sanguine',
    'Radiologie',
    'Échographie',
    'Vaccination',
    'Chirurgie Mineure',
    'Médicaments',
    'Autre'
  ];

  // Options pour les méthodes de paiement
  paymentMethods = [
    { value: 'credit_card', label: 'Carte de crédit' },
    { value: 'bank_transfer', label: 'Virement bancaire' },
    { value: 'cash', label: 'Espèces' },
    { value: 'insurance', label: 'Assurance' }
  ];

  constructor(
    private billService: BillService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Vérifier l'authentification avant de charger les données
    if (this.authService.isAuthenticated()) {
      this.loadBills();
    } else {
      console.error('Utilisateur non authentifié');
      // Rediriger vers la page de connexion
      this.authService.logout();
    }
  }

  loadBills(): void {
    this.isLoading = true;
    
    // Mettre à jour les filtres avec les valeurs du formulaire
    this.updateFilters();
    
    this.billService.getBills(this.filters).subscribe({
      next: (response) => {
        if (response.success) {
          this.bills = response.data.items;
          this.pagination = response.data.pagination;
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des factures:', error);
        this.isLoading = false;
        
        // Gestion spécifique de l'erreur 401 (Unauthorized)
        if (error.status === 401) {
          console.error('Token invalide ou expiré, redirection vers la connexion');
          this.authService.logout();
        }
      }
    });
  }

  private updateFilters(): void {
    this.filters = {
      page: this.filters.page || 1,
      per_page: this.filters.per_page || 15
    };

    if (this.patientIdFilter) {
      this.filters.patient_id = parseInt(this.patientIdFilter);
    }
    if (this.doctorNameFilter) {
      this.filters.doctor_name = this.doctorNameFilter;
    }
    if (this.paymentMethodFilter) {
      this.filters.payment_method = this.paymentMethodFilter;
    }
    if (this.presetPeriodFilter) {
      this.filters.preset_period = this.presetPeriodFilter;
    }
  }

  onFilterChange(): void {
    this.filters.page = 1; // Reset to first page when filtering
    this.loadBills();
  }

  onPageChange(page: number): void {
    this.filters.page = page;
    this.loadBills();
  }

  clearFilters(): void {
    this.patientIdFilter = '';
    this.doctorNameFilter = '';
    this.paymentMethodFilter = '';
    this.presetPeriodFilter = '';
    this.filters = { page: 1, per_page: 15 };
    this.loadBills();
  }

  getPaymentMethodLabel(method: string): string {
    const labels: { [key: string]: string } = {
      'credit_card': 'Carte de crédit',
      'bank_transfer': 'Virement bancaire',
      'cash': 'Espèces',
      'insurance': 'Assurance'
    };
    return labels[method] || method;
  }

  getPaymentMethodBadgeClass(method: string): string {
    const classes: { [key: string]: string } = {
      'credit_card': 'bg-blue-100 text-blue-800',
      'bank_transfer': 'bg-purple-100 text-purple-800',
      'cash': 'bg-green-100 text-green-800',
      'insurance': 'bg-yellow-100 text-yellow-800'
    };
    return classes[method] || 'bg-gray-100 text-gray-800';
  }

  getServiceTypeLabel(serviceType: string): string {
    const labels: { [key: string]: string } = {
      'CHECKUP': 'Consultation',
      'SPECIALIST': 'Spécialiste',
      'LABORATORY': 'Laboratoire',
      'RADIOLOGY': 'Radiologie',
      'SURGERY': 'Chirurgie',
      'EMERGENCY': 'Urgence',
      'MEDICATION': 'Médicament'
    };
    return labels[serviceType] || serviceType;
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  viewBillDetails(bill: Bill): void {
    this.selectedBill = bill;
  }

  closeModal(): void {
    this.selectedBill = null;
  }

  downloadPDF(bill: Bill): void {
    if (bill.pdf_path) {
      // TODO: Implémenter le téléchargement du PDF
      console.log('Téléchargement du PDF:', bill.pdf_path);
      alert(`Téléchargement du PDF pour la facture ${bill.bill_number}\nChemin: ${bill.pdf_path}\n\n(Fonctionnalité à implémenter)`);
    }
  }

  printBill(bill: Bill): void {
    // Créer un contenu HTML pour l'impression
    const printContent = this.generatePrintableInvoice(bill);
    
    // Créer une nouvelle fenêtre pour l'impression
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      
      // Attendre que le contenu soit chargé puis imprimer
      printWindow.onload = function() {
        printWindow.print();
        printWindow.close();
      };
    } else {
      alert('Impossible d\'ouvrir la fenêtre d\'impression. Vérifiez que les pop-ups ne sont pas bloqués.');
    }
  }

  private generatePrintableInvoice(bill: Bill): string {
    const currentDate = new Date().toLocaleDateString('fr-FR');
    
    let itemsHtml = '';
    bill.items.forEach(item => {
      itemsHtml += `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${this.getServiceTypeLabel(item.service_type)}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.description}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${parseFloat(item.price).toFixed(2)} MAD</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${parseFloat(item.total).toFixed(2)} MAD</td>
        </tr>
      `;
    });

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Facture ${bill.bill_number}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 20px; 
            line-height: 1.6;
          }
          .header { 
            text-align: center; 
            margin-bottom: 30px; 
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
          }
          .invoice-info { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 30px; 
          }
          .invoice-info div { 
            width: 48%; 
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 20px; 
          }
          th { 
            background-color: #f5f5f5; 
            padding: 12px 8px; 
            text-align: left; 
            border-bottom: 2px solid #333;
            font-weight: bold;
          }
          .total-section { 
            text-align: right; 
            margin-top: 20px; 
            font-size: 18px; 
            font-weight: bold;
          }
          .footer { 
            margin-top: 40px; 
            text-align: center; 
            font-size: 12px; 
            color: #666;
          }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>FACTURE MÉDICALE</h1>
          <h2>Cabinet Médical ASIO</h2>
          <p>123 Avenue Mohammed V, Casablanca, Maroc<br>
          Tél: +212 5 22 00 00 00 | Email: contact@asio-medical.ma</p>
        </div>

        <div class="invoice-info">
          <div>
            <h3>Informations Patient:</h3>
            <p><strong>${bill.patient.user.name}</strong><br>
            Email: ${bill.patient.user.email}<br>
            Téléphone: ${bill.patient.user.phone}<br>
            ID Patient: ${bill.patient_id}</p>
          </div>
          <div>
            <h3>Informations Facture:</h3>
            <p><strong>N° Facture:</strong> ${bill.bill_number}<br>
            <strong>Date d'émission:</strong> ${new Date(bill.issue_date).toLocaleDateString('fr-FR')}<br>
            <strong>Docteur:</strong> ${bill.doctor.name}<br>
            <strong>Spécialité:</strong> ${bill.doctor.doctor.specialty}<br>
            <strong>Méthode de paiement:</strong> ${this.getPaymentMethodLabel(bill.payment_method)}</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Type de Service</th>
              <th>Description</th>
              <th style="text-align: center;">Quantité</th>
              <th style="text-align: right;">Prix Unitaire</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="total-section">
          <p><strong>MONTANT TOTAL: ${parseFloat(bill.amount).toFixed(2)} MAD</strong></p>
        </div>

        <div style="margin-top: 30px;">
          <p><strong>Description:</strong> ${bill.description || 'Aucune description'}</p>
        </div>

        <div class="footer">
          <p>Facture générée le ${currentDate}</p>
          <p>Merci de votre confiance | Cabinet Médical ASIO</p>
        </div>
      </body>
      </html>
    `;
  }

  getPagesArray(): number[] {
    if (!this.pagination) return [];
    return Array(this.pagination.last_page).fill(0).map((_, i) => i + 1);
  }

  getVisiblePages(): (number | string)[] {
    if (!this.pagination) return [];
    
    const current = this.pagination.current_page;
    const last = this.pagination.last_page;
    const delta = 2; // Nombre de pages à afficher de chaque côté de la page courante
    
    let range: (number | string)[] = [];
    
    if (last <= 7) {
      // Si il y a 7 pages ou moins, afficher toutes les pages
      range = Array.from({ length: last }, (_, i) => i + 1);
    } else {
      // Logique complexe pour afficher les pages avec des ellipses
      if (current <= delta + 2) {
        // Début : 1, 2, 3, 4, 5, ..., last
        range = Array.from({ length: delta + 3 }, (_, i) => i + 1);
        range.push('...');
        range.push(last);
      } else if (current >= last - delta - 1) {
        // Fin : 1, ..., last-4, last-3, last-2, last-1, last
        range = [1, '...'];
        range.push(...Array.from({ length: delta + 3 }, (_, i) => last - delta - 2 + i));
      } else {
        // Milieu : 1, ..., current-1, current, current+1, ..., last
        range = [1, '...'];
        range.push(...Array.from({ length: delta * 2 + 1 }, (_, i) => current - delta + i));
        range.push('...');
        range.push(last);
      }
    }
    
    return range;
  }

  getPageButtonClass(page: number): string {
    const baseClasses = 'relative inline-flex items-center px-3 py-2 text-sm font-medium border rounded-md transition-all duration-200';
    
    if (this.pagination && page === this.pagination.current_page) {
      return `${baseClasses} bg-indigo-600 border-indigo-600 text-white shadow-md transform scale-105`;
    } else {
      return `${baseClasses} bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-indigo-600 hover:border-indigo-300`;
    }
  }

  onPerPageChange(): void {
    this.filters.page = 1; // Reset to first page when changing per_page
    this.loadBills();
  }

  // Méthodes pour la création de factures
  openCreateModal(): void {
    this.showCreateModal = true;
    this.resetCreateForm();
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
    this.resetCreateForm();
  }

  resetCreateForm(): void {
    this.newBill = {
      patient_id: 0,
      doctor_user_id: 0,
      issue_date: new Date().toISOString().split('T')[0],
      payment_method: '',
      description: '',
      items: []
    };
    this.newItem = {
      service_type: '',
      description: '',
      price: 0
    };
  }

  addNewItem(): void {
    if (this.newItem.service_type && this.newItem.description && this.newItem.price > 0) {
      this.newBill.items.push({ ...this.newItem });
      this.newItem = {
        service_type: '',
        description: '',
        price: 0
      };
    }
  }

  removeItem(index: number): void {
    this.newBill.items.splice(index, 1);
  }

  getTotalAmount(): number {
    return this.newBill.items.reduce((total, item) => total + item.price, 0);
  }

  createBill(): void {
    if (this.isValidCreateForm()) {
      this.isCreating = true;
      
      this.billService.createBill(this.newBill).subscribe({
        next: (response) => {
          if (response.success) {
            alert('Facture créée avec succès !');
            this.closeCreateModal();
            this.loadBills(); // Recharger la liste des factures
          } else {
            alert('Erreur lors de la création de la facture: ' + response.message);
          }
          this.isCreating = false;
        },
        error: (error) => {
          console.error('Erreur lors de la création de la facture:', error);
          let errorMessage = 'Erreur lors de la création de la facture';
          
          if (error.error && error.error.message) {
            errorMessage = error.error.message;
          } else if (error.status === 401) {
            errorMessage = 'Vous n\'êtes pas autorisé à créer des factures';
            this.authService.logout();
          }
          
          alert(errorMessage);
          this.isCreating = false;
        }
      });
    }
  }

  isValidCreateForm(): boolean {
    if (!this.newBill.patient_id || this.newBill.patient_id <= 0) {
      alert('Veuillez saisir un ID patient valide');
      return false;
    }
    
    if (!this.newBill.doctor_user_id || this.newBill.doctor_user_id <= 0) {
      alert('Veuillez saisir un ID docteur valide');
      return false;
    }
    
    if (!this.newBill.payment_method) {
      alert('Veuillez sélectionner une méthode de paiement');
      return false;
    }
    
    if (!this.newBill.issue_date) {
      alert('Veuillez saisir une date d\'émission');
      return false;
    }
    
    if (this.newBill.items.length === 0) {
      alert('Veuillez ajouter au moins un service à la facture');
      return false;
    }
    
    return true;
  }

  // Méthodes pour la modification de factures
  openEditModal(bill: Bill): void {
    this.billToEdit = bill;
    this.showEditModal = true;
    this.editBill = {
      payment_method: bill.payment_method,
      description: bill.description || '',
      items: bill.items.map(item => ({
        service_type: item.service_type,
        description: item.description,
        price: parseFloat(item.price)
      }))
    };
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.billToEdit = null;
    this.editBill = {
      payment_method: '',
      description: '',
      items: []
    };
  }

  addEditItem(): void {
    if (this.newItem.service_type && this.newItem.description && this.newItem.price > 0) {
      this.editBill.items!.push({ ...this.newItem });
      this.newItem = {
        service_type: '',
        description: '',
        price: 0
      };
    }
  }

  removeEditItem(index: number): void {
    this.editBill.items!.splice(index, 1);
  }

  getEditTotalAmount(): number {
    return this.editBill.items!.reduce((total, item) => total + item.price, 0);
  }

  updateBill(): void {
    if (this.billToEdit && this.isValidEditForm()) {
      this.isUpdating = true;
      
      this.billService.updateBill(this.billToEdit.id, this.editBill).subscribe({
        next: (response) => {
          if (response.success) {
            alert('Facture mise à jour avec succès !');
            this.closeEditModal();
            this.loadBills(); // Recharger la liste des factures
          } else {
            alert('Erreur lors de la mise à jour de la facture: ' + response.message);
          }
          this.isUpdating = false;
        },
        error: (error) => {
          console.error('Erreur lors de la mise à jour de la facture:', error);
          let errorMessage = 'Erreur lors de la mise à jour de la facture';
          
          if (error.error && error.error.message) {
            errorMessage = error.error.message;
          } else if (error.status === 401) {
            errorMessage = 'Vous n\'êtes pas autorisé à modifier des factures';
            this.authService.logout();
          }
          
          alert(errorMessage);
          this.isUpdating = false;
        }
      });
    }
  }

  isValidEditForm(): boolean {
    if (!this.editBill.payment_method) {
      alert('Veuillez sélectionner une méthode de paiement');
      return false;
    }
    
    if (!this.editBill.items || this.editBill.items.length === 0) {
      alert('Veuillez ajouter au moins un service à la facture');
      return false;
    }
    
    return true;
  }

  // Méthodes pour la suppression de factures
  deleteBill(bill: Bill): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer la facture ${bill.bill_number} ?\n\nCette action est irréversible.`)) {
      this.billService.deleteBill(bill.id).subscribe({
        next: (response) => {
          if (response.success) {
            alert('Facture supprimée avec succès !');
            this.loadBills(); // Recharger la liste des factures
          } else {
            alert('Erreur lors de la suppression de la facture: ' + response.message);
          }
        },
        error: (error) => {
          console.error('Erreur lors de la suppression de la facture:', error);
          let errorMessage = 'Erreur lors de la suppression de la facture';
          
          if (error.error && error.error.message) {
            errorMessage = error.error.message;
          } else if (error.status === 401) {
            errorMessage = 'Vous n\'êtes pas autorisé à supprimer des factures';
            this.authService.logout();
          }
          
          alert(errorMessage);
        }
      });
    }
  }

  // Méthodes pour ajouter un item à une facture existante
  openAddItemModal(bill: Bill): void {
    this.billToAddItem = bill;
    this.showAddItemModal = true;
    this.newItemToAdd = {
      service_type: '',
      description: '',
      price: 0
    };
  }

  closeAddItemModal(): void {
    this.showAddItemModal = false;
    this.billToAddItem = null;
    this.newItemToAdd = {
      service_type: '',
      description: '',
      price: 0
    };
  }

  addItemToBill(): void {
    if (this.billToAddItem && this.isValidAddItemForm()) {
      this.isAddingItem = true;
      
      this.billService.addItemToBill(this.billToAddItem.id, this.newItemToAdd).subscribe({
        next: (response) => {
          if (response.success) {
            alert('Article ajouté avec succès !');
            this.closeAddItemModal();
            this.loadBills(); // Recharger la liste des factures
          } else {
            alert('Erreur lors de l\'ajout de l\'article: ' + response.message);
          }
          this.isAddingItem = false;
        },
        error: (error) => {
          console.error('Erreur lors de l\'ajout de l\'article:', error);
          let errorMessage = 'Erreur lors de l\'ajout de l\'article';
          
          if (error.error && error.error.message) {
            errorMessage = error.error.message;
          } else if (error.status === 401) {
            errorMessage = 'Vous n\'êtes pas autorisé à ajouter des articles';
            this.authService.logout();
          }
          
          alert(errorMessage);
          this.isAddingItem = false;
        }
      });
    }
  }

  isValidAddItemForm(): boolean {
    if (!this.newItemToAdd.service_type) {
      alert('Veuillez sélectionner un type de service');
      return false;
    }
    
    if (!this.newItemToAdd.description) {
      alert('Veuillez saisir une description');
      return false;
    }
    
    if (!this.newItemToAdd.price || this.newItemToAdd.price <= 0) {
      alert('Veuillez saisir un prix valide');
      return false;
    }
    
    return true;
  }
}