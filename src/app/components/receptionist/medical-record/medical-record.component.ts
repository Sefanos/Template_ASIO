import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PatientService, PatientCollectionResponse } from '../../../services/recepetionist-services/patient.service';
import { Subscription } from 'rxjs';

interface Patient {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: string;
  photo?: string;
  dob?: string;
  gender?: string;
  nationality: string;
  blood_group: string;
  marital_status: string;
  address: string;
  emergency_contact?: string;
  created_at: string;
  updated_at: string;
  showDetails: boolean;
}

interface NewPatient {
  name: string;
  email: string;
  phone: string;
  dob: string;
  gender: string;
  nationality: string;
  blood_group: string;
  marital_status: string;
  address: string;
  status: string;
  emergency_contact: string;
  showDetails: boolean;
}

@Component({
  selector: 'app-medical-record',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, FormsModule],
  templateUrl: './medical-record.component.html',
  styleUrls: ['./medical-record.component.css']
})
export class MedicalRecordComponent implements OnInit, OnDestroy {
  // Vue et état
  currentView = 'grid';
  isListView = false;
  isLoading = false;
  
  // Modals
  isAddModalOpen = false;
  isEditModalOpen = false;
  isDeleteModalOpen = false;
  
  // Données patients
  patients: Patient[] = [];
  editingPatient: Patient | null = null;
  patientToDelete: Patient | null = null;
  
  // Nouveau patient
  newPatient: NewPatient = {
    name: '',
    email: '',
    phone: '',
    dob: '',
    gender: '',
    nationality: '',
    blood_group: '',
    marital_status: '',
    address: '',
    status: 'active',
    emergency_contact: '',
    showDetails: false
  };
  
  // Upload de fichier
  selectedFile: File | null = null;
  
  // Pagination
  currentPage = 1;
  itemsPerPage = 15;
  totalItems = 0;
  lastPage = 1;
  
  // Filtres et recherche
  searchQuery = '';
  selectedStatus = '';
  
  // Options pour les dropdowns
  statusOptions = [
    { value: '', label: 'Tous les statuts' },
    { value: 'active', label: 'Actif' },
    { value: 'inactive', label: 'Inactif' },
    { value: 'pending', label: 'En attente' }
  ];
  
  genderOptions = [
    { value: 'Homme', label: 'Homme' },
    { value: 'Femme', label: 'Femme' },
    { value: 'Autre', label: 'Autre' }
  ];
  
  bloodGroupOptions = [
    'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
  ];
  
  maritalStatusOptions = [
    'Célibataire', 'Marié(e)', 'Divorcé(e)', 'Veuf/Veuve', 'Autre'
  ];
  
  // Subscriptions
  private subscriptions: Subscription[] = [];

  constructor(
    private patientService: PatientService
  ) {}

  ngOnInit(): void {
    this.loadPatients();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // ===== CHARGEMENT DES DONNÉES =====
  
  loadPatients(): void {
    this.isLoading = true;
    
    const subscription = this.patientService.getPatients(
      this.currentPage, 
      this.itemsPerPage, 
      this.searchQuery, 
      this.selectedStatus
    ).subscribe({
      next: (response: PatientCollectionResponse) => {
        this.patients = response.data.map(p => ({ ...p, showDetails: false }));
        this.totalItems = response.pagination.total;
        this.currentPage = response.pagination.current_page;
        this.itemsPerPage = response.pagination.per_page;
        this.lastPage = response.pagination.last_page;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des patients', err);
        this.showToast('Erreur lors du chargement des patients', 'error');
        this.isLoading = false;
      }
    });
    
    this.subscriptions.push(subscription);
  }

  // ===== GESTION DES MODALS =====
  
  openAddModal(): void {
    this.resetNewPatient();
    this.isAddModalOpen = true;
    this.editingPatient = null;
  }

  openEditModal(patient: Patient): void {
    this.editingPatient = patient;
    this.newPatient = {
      name: patient.name || '',
      email: patient.email || '',
      phone: patient.phone || '',
      dob: patient.dob || '',
      gender: patient.gender || '',
      nationality: patient.nationality || '',
      blood_group: patient.blood_group || '',
      marital_status: patient.marital_status || '',
      address: patient.address || '',
      status: patient.status || 'active',
      emergency_contact: patient.emergency_contact || '',
      showDetails: patient.showDetails || false
    };
    this.isAddModalOpen = true;
  }

  closeAddModal(): void {
    this.isAddModalOpen = false;
    this.editingPatient = null;
    this.resetNewPatient();
    this.selectedFile = null;
  }

  openDeleteModal(patient: Patient): void {
    this.patientToDelete = patient;
    this.isDeleteModalOpen = true;
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen = false;
    this.patientToDelete = null;
  }

  // ===== CRUD OPERATIONS =====
  
  savePatient(): void {
    if (!this.newPatient.name || !this.newPatient.email) {
      this.showToast('Le nom et l\'email sont obligatoires.', 'warning');
      return;
    }

    const formData = new FormData();
    
    // Ajouter tous les champs du patient en s'assurant qu'ils ne sont pas vides
    Object.keys(this.newPatient).forEach(key => {
      const value = this.newPatient[key as keyof NewPatient];
      if (value !== null && value !== undefined && value !== '' && key !== 'showDetails') {
        formData.append(key, value as string);
      }
    });
    
    // S'assurer que les champs requis sont présents même si vides
    const requiredFields = ['name', 'email', 'status'];
    requiredFields.forEach(field => {
      if (!formData.has(field)) {
        const value = this.newPatient[field as keyof NewPatient];
        formData.append(field, value as string || '');
      }
    });
    
    // Ajouter la photo si sélectionnée - Temporairement désactivé pour les mises à jour 
    // à cause d'un problème de base de données avec profile_image
    if (this.selectedFile && !this.editingPatient) {
      formData.append('photo', this.selectedFile);
      console.log('Photo added to form data for new patient');
    } else if (this.selectedFile && this.editingPatient) {
      console.warn('Photo upload disabled for updates due to database column issue');
      this.showToast('Note: La mise à jour de la photo est temporairement désactivée', 'warning');
    }

    // Debug: afficher ce qui va être envoyé
    console.log('Data being sent:');
    formData.forEach((value, key) => {
      console.log(`${key}: ${value}`);
    });

    const action = this.editingPatient
      ? this.patientService.updatePatient(this.editingPatient.id, formData)
      : this.patientService.addPatient(formData);
    
    const successMessage = this.editingPatient ? 'Patient mis à jour avec succès' : 'Patient ajouté avec succès';
    const errorMessage = this.editingPatient ? 'Erreur lors de la mise à jour' : 'Erreur lors de l\'ajout';

    const subscription = action.subscribe({
      next: (response) => {
        this.loadPatients();
        this.closeAddModal();
        this.showToast(successMessage, 'success');
      },
      error: (error) => {
        console.error('Error:', error);
        let errorMsg = errorMessage;
        
        // Handle database/SQL errors specifically
        if (error?.error?.message && error.error.message.includes('SQLSTATE')) {
          console.error('Database error detected:', error.error.message);
          if (error.error.message.includes('profile_image')) {
            errorMsg = 'Erreur de base de données: La colonne profile_image n\'existe pas. Veuillez contacter l\'administrateur.';
          } else {
            errorMsg = 'Erreur de base de données. Veuillez contacter l\'administrateur.';
          }
        }
        // Afficher les erreurs de validation si disponibles
        else if (error?.error?.errors) {
          console.error('Validation errors:', error.error.errors);
          const firstError = Object.values(error.error.errors)[0] as string[];
          errorMsg = firstError[0] || errorMessage;
          
          // Afficher toutes les erreurs de validation dans la console pour debug
          Object.keys(error.error.errors).forEach(field => {
            console.error(`${field}: ${error.error.errors[field].join(', ')}`);
          });
        } else if (error?.error?.message) {
          console.error('Error message:', error.error.message);
          errorMsg = error.error.message;
        }
        
        this.showToast(errorMsg, 'error');
      }
    });
    
    this.subscriptions.push(subscription);
  }

  confirmDelete(): void {
    if (!this.patientToDelete) return;

    const subscription = this.patientService.deletePatient(this.patientToDelete.id).subscribe({
      next: () => {
        this.loadPatients();
        this.closeDeleteModal();
        this.showToast('Patient supprimé avec succès', 'success');
      },
      error: (error) => {
        console.error('Error deleting patient:', error);
        this.showToast('Erreur lors de la suppression', 'error');
      }
    });
    
    this.subscriptions.push(subscription);
  }

  // ===== GESTION DES FICHIERS =====
  
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validation du fichier
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
      const maxSize = 2 * 1024 * 1024; // 2MB
      
      if (!validTypes.includes(file.type)) {
        this.showToast('Type de fichier non supporté. Utilisez JPEG, PNG, JPG ou GIF.', 'warning');
        return;
      }
      
      if (file.size > maxSize) {
        this.showToast('Le fichier est trop volumineux. Maximum 2MB.', 'warning');
        return;
      }
      
      this.selectedFile = file;
    }
  }

  // ===== RECHERCHE ET FILTRES =====
  
  onSearch(): void {
    this.currentPage = 1;
    this.loadPatients();
  }

  onStatusFilter(): void {
    this.currentPage = 1;
    this.loadPatients();
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedStatus = '';
    this.currentPage = 1;
    this.loadPatients();
  }

  // ===== PAGINATION =====
  
  goToPage(page: number): void {
    if (page >= 1 && page <= this.lastPage && page !== this.currentPage) {
      this.currentPage = page;
      this.loadPatients();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.goToPage(this.currentPage - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage < this.lastPage) {
      this.goToPage(this.currentPage + 1);
    }
  }

  // ===== AFFICHAGE ET NAVIGATION =====
  
  toggleView(): void {
    this.isListView = !this.isListView;
    this.currentView = this.isListView ? 'list' : 'grid';
  }

  togglePatientDetails(patient: Patient): void {
    patient.showDetails = !patient.showDetails;
  }

  // ===== UTILITAIRES =====
  
  resetNewPatient(): void {
    this.newPatient = {
      name: '',
      email: '',
      phone: '',
      dob: '',
      gender: '',
      nationality: '',
      blood_group: '',
      marital_status: '',
      address: '',
      status: 'active',
      emergency_contact: '',
      showDetails: false
    };
  }

  showToast(message: string, type: 'success' | 'error' | 'warning' = 'success'): void {
    // Implémentation simple de toast pour le moment
    console.log(`[${type.toUpperCase()}] ${message}`);
    
    // Vous pouvez intégrer votre service de toast préféré ici
    // Par exemple: this.toastService.show(message, type);
    
    // Toast basique avec alert pour les erreurs critiques
    if (type === 'error') {
      // Affichage temporaire d'une notification
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded shadow-lg z-50';
      notification.textContent = message;
      document.body.appendChild(notification);
      
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 3000);
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'active':
        return 'status-active';
      case 'inactive':
        return 'status-inactive';
      case 'pending':
        return 'status-pending';
      default:
        return 'status-inactive';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'active':
        return 'Actif';
      case 'inactive':
        return 'Inactif';
      case 'pending':
        return 'En attente';
      default:
        return status;
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'Non renseigné';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR');
    } catch {
      return 'Date invalide';
    }
  }

  calculateAge(birthdate: string): number | null {
    if (!birthdate) return null;
    
    try {
      const birth = new Date(birthdate);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      
      return age;
    } catch {
      return null;
    }
  }

  // ===== GETTERS POUR LES TEMPLATES =====
  
  get paginationInfo(): string {
    const start = (this.currentPage - 1) * this.itemsPerPage + 1;
    const end = Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
    return `${start}-${end} sur ${this.totalItems}`;
  }

  get hasPatients(): boolean {
    return this.patients.length > 0;
  }

  get isFirstPage(): boolean {
    return this.currentPage === 1;
  }

  get isLastPage(): boolean {
    return this.currentPage === this.lastPage;
  }

  get paginationPages(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.lastPage, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }
}