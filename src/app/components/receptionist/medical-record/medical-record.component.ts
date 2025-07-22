import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { SafeStringPipe } from './safe-string.pipe';
import { FormsModule } from '@angular/forms';
import { PatientService } from '../../../services/recepetionist-services/patient.service';
import { Subscription } from 'rxjs';

// Interfaces
interface Patient {
  id: number;
  name: string;
  email: string;
  phone?: string;
  dob?: string;
  gender?: string;
  nationality?: string;
  blood_group?: string;
  marital_status?: string;
  address?: string;
  status: string;
  emergency_contact?: string;
  photo?: string;
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

interface PatientCollectionResponse {
  data: Patient[];
  pagination: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
  };
}

@Component({
  selector: 'app-medical-record',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule, NgClass],
  templateUrl: './medical-record.component.html',
  styleUrls: ['./medical-record.component.css']
})
export class MedicalRecordComponent implements OnInit, OnDestroy {
  // Pagination slice helpers for template
  getPaginationSliceStart(): number {
    return this.currentPage > 2 ? this.currentPage - 2 : 1;
  }
  getPaginationSliceEnd(): number {
    return this.currentPage < this.lastPage - 1 ? this.currentPage + 1 : this.lastPage - 1;
  }
  getDobForAge(dob: string | undefined): string {
    return dob ?? '';
  }
  // Helper to ensure dob is always a string for template strictness
  safeDob(dob: string | undefined): string {
    return typeof dob === 'string' ? dob : '';
  }
  // Vue et état
  currentView = 'grid';
  isListView = false;
  isLoading = false;

  // Modals
  isAddModalOpen = false;
  isDeleteModalOpen = false;

  // Contrôle du modal de succès
  showSuccessModal = false;
  successMessage = '';

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

  bloodGroupOptions = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  maritalStatusOptions = ['Célibataire', 'Marié(e)', 'Divorcé(e)', 'Veuf/Veuve', 'Autre'];

  // Subscriptions
  private subscriptions: Subscription[] = [];

  constructor(private patientService: PatientService) {}

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
      error: (err: any) => {
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

    Object.keys(this.newPatient).forEach(key => {
      const value = this.newPatient[key as keyof NewPatient];
      if (value !== null && value !== undefined && value !== '' && key !== 'showDetails') {
        formData.append(key, value as string);
      }
    });

    const requiredFields = ['name', 'email', 'status'];
    requiredFields.forEach(field => {
      if (!formData.has(field)) {
        const value = this.newPatient[field as keyof NewPatient];
        formData.append(field, value as string || '');
      }
    });

    if (this.selectedFile && !this.editingPatient) {
      formData.append('photo', this.selectedFile);
      console.log('Photo added to form data for new patient');
    } else if (this.selectedFile && this.editingPatient) {
      console.warn('Photo upload disabled for updates due to database column issue');
      this.showToast('Note : La mise à jour de la photo est temporairement désactivée', 'warning');
    }

    console.log('Data being sent:');
    formData.forEach((value, key) => {
      console.log(`${key}: ${value}`);
    });

    const action = this.editingPatient
      ? this.patientService.updatePatient(this.editingPatient.id, formData)
      : this.patientService.addPatient(formData);

    const successMessage = this.editingPatient
      ? 'Patient mis à jour avec succès'
      : 'Patient ajouté avec succès';

    const subscription = action.subscribe({
      next: () => {
        this.loadPatients();
        this.closeAddModal();
        this.showSuccess(successMessage); // ✅ Utilisation du modal de succès
      },
      error: (error: any) => {
        console.error('Error:', error);
        let errorMsg = this.editingPatient
          ? 'Erreur lors de la mise à jour'
          : 'Erreur lors de l\'ajout';

        if (error?.error?.message && error.error.message.includes('SQLSTATE')) {
          console.error('Database error detected:', error.error.message);
          if (error.error.message.includes('profile_image')) {
            errorMsg = 'Erreur de base de données : La colonne profile_image n\'existe pas. Veuillez contacter l\'administrateur.';
          } else {
            errorMsg = 'Erreur de base de données. Veuillez contacter l\'administrateur.';
          }
        } else if (error?.error?.errors) {
          console.error('Validation errors:', error.error.errors);
          const firstError = Object.values(error.error.errors)[0] as string[];
          errorMsg = firstError[0] || errorMsg;
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
        this.showSuccess('Patient supprimé avec succès'); // ❌ Optionnel : tu peux le garder ou non
      },
      error: (error: any) => {
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

  // ✅ Modal de succès
  showSuccess(message: string): void {
    this.successMessage = message;
    this.showSuccessModal = true;
    setTimeout(() => this.hideSuccessModal(), 3000); // Auto-close après 3s
  }

  hideSuccessModal(): void {
    this.showSuccessModal = false;
    this.successMessage = '';
  }

  // ⚠️ Ancien système de toast (optionnel : tu peux le garder pour erreurs)
  showToast(message: string, type: 'success' | 'error' | 'warning' = 'success'): void {
    console.log(`[${type.toUpperCase()}] ${message}`);

    // Affichage visuel basique si tu veux garder quelques notifications
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 px-4 py-2 rounded shadow-lg z-50 text-white ${
      type === 'success' ? 'bg-green-500' :
      type === 'error' ? 'bg-red-500' : 'bg-yellow-500'
    }`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      document.body.removeChild(notification);
    }, 3000);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'active': return 'Actif';
      case 'inactive': return 'Inactif';
      case 'pending': return 'En attente';
      default: return status;
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

  calculateAge(birthdate: any): number | null {
    const dateStr = typeof birthdate === 'string' ? birthdate : '';
    if (!dateStr) return null;
    try {
      const birth = new Date(dateStr);
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
  // Helper to ensure dob is always a string
  getDobString(dob: string | undefined): string {
    return dob ?? '';
  }
  // ===== GETTERS FOR PAGINATION BUTTONS =====
  get isFirstPage(): boolean {
    return this.currentPage === 1;
  }

  get isLastPage(): boolean {
    return this.currentPage === this.lastPage;
  }

  get paginationPages(): number[] {
    return Array.from({ length: this.lastPage }, (_, i) => i + 1);
  }
  }