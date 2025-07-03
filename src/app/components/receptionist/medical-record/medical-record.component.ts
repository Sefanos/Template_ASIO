import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { PatientService, Pagination } from '../../../services/recepetionist-services/patient.service';
import { ThemeService } from '../../../services/theme.service';
import { ToastService } from '../../../shared/services/toast.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-medical-record',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, FormsModule],
  templateUrl: './medical-record.component.html',
  styleUrls: ['./medical-record.component.css']
})
export class MedicalRecordComponent implements OnInit, OnDestroy {
  currentView = 'grid';
  isListView = false;
  isDarkMode = false;
  private themeSubscription: Subscription | null = null;

  patients: any[] = [];
  filteredPatients: any[] = [];
  pagedPatients: any[] = [];

  searchQuery = '';
  selectedStatus = '';

  itemsPerPage = 15; // Correspond à per_page de l'API
  currentPage = 1;
  totalItems = 0;
  lastPage = 1;
  isLoading = false;
  
  pagination: Pagination = {
    total: 0,
    current_page: 1,
    per_page: 15,
    last_page: 1
  };

  showAddModal = false;
  editingPatient: any = null;
  selectedFile: File | null = null;
  newPatient: any = {
    id: null,
    name: '',
    email: '',
    phone: '',
    dob: '',
    photo: '/assets/images/default-user.png',
    status: 'active',
    nationality: '',
    blood_group: '',
    marital_status: '',
    gender: '',
    address: '',
    showDetails: false
  };

  constructor(
    private patientService: PatientService,
    private themeService: ThemeService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadPatients();
    this.themeSubscription = this.themeService.darkMode$.subscribe(isDark => {
      this.isDarkMode = isDark;
    });
  }
  
  ngOnDestroy(): void {
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe();
    }
  }

  loadPatients() {
    this.isLoading = true;
    this.patientService.getPatients(this.currentPage).subscribe({
      next: (data) => {
        this.patients = data.patients.map(p => ({ ...p, showDetails: false }));
        this.pagination = data.pagination;
        this.totalItems = data.pagination.total;
        this.currentPage = data.pagination.current_page;
        this.itemsPerPage = data.pagination.per_page;
        this.lastPage = data.pagination.last_page;
        
        this.applyFilters(); // Applique aussi les filtres
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des patients', err);
        this.toastService.error('Erreur lors du chargement des patients');
        this.isLoading = false;
      }
    });
  }

  applyFilters() {
    this.filteredPatients = this.patients.filter(patient => {
      const matchesSearch =
        !this.searchQuery ||
        patient.name?.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        ('#' + patient.id).toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        patient.email?.toLowerCase().includes(this.searchQuery.toLowerCase());

      const matchesStatus =
        !this.selectedStatus || patient.status === this.selectedStatus;

      return matchesSearch && matchesStatus;
    });

    this.updatePagedPatients();
  }

  updatePagedPatients() {
    // Comme nous utilisons la pagination côté serveur, 
    // les patients filtrés sont déjà paginés
    this.pagedPatients = this.filteredPatients;
  }

  goToPreviousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadPatients();
    }
  }

  goToNextPage() {
    if (this.currentPage < this.lastPage) {
      this.currentPage++;
      this.loadPatients();
    }
  }

  getPageNumbers(): number[] {
    const totalPages = this.lastPage;
    // Limiter le nombre de pages affichées
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    // Calcul des pages à afficher
    let startPage = Math.max(1, this.currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = startPage + maxPagesToShow - 1;
    
    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  }

  goToPage(page: number) {
    this.currentPage = page;
    this.loadPatients();
  }

  toggleView() {
    this.currentView = this.isListView ? 'list' : 'grid';
  }

  getStatusLabel(status: string): string {
    switch (status?.toLowerCase()) {
      case 'active': return 'Actif';
      case 'follow up': return 'En Suivi';
      case 'critical': return 'Urgent';
      default: return 'Inconnu';
    }
  }

  getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'follow up': return 'bg-yellow-100 text-yellow-700';
      case 'critical': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  }

  getPhotoUrl(photo: string): string {
    if (!photo) return '/assets/images/default-user.png';
    if (photo.startsWith('http')) return photo;
    if (photo.startsWith('/storage/')) return 'http://localhost:8000' + photo;
    if (photo.startsWith('/assets/')) return photo;
    return photo;
  }

  onImageError(event: any) {
    event.target.src = 'https://via.placeholder.com/60x60?text=Erreur ';
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  openAddModal() {
    this.editingPatient = null;
    this.newPatient = {
      id: null,
      name: '',
      email: '',
      phone: '',
      dob: '',
      photo: '/assets/images/default-user.png',
      status: 'active',
      nationality: '',
      blood_group: '',
      marital_status: '',
      gender: '',
      address: '',
      showDetails: false
    };
    this.selectedFile = null;
    this.showAddModal = true;
  }

  closeAddModal() {
    this.showAddModal = false;
  }

  saveNewPatient() {
    if (!this.newPatient.name || !this.newPatient.email) {
      this.toastService.warning('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    const formData = new FormData();
    for (const key in this.newPatient) {
      if (this.newPatient[key] !== undefined && this.newPatient[key] !== null) {
        formData.append(key, this.newPatient[key]);
      }
    }
    if (this.selectedFile) {
      formData.append('photo', this.selectedFile);
    }

    this.patientService.addPatient(formData).subscribe({
      next: () => {
        this.loadPatients();
        this.closeAddModal();
        this.toastService.success('Patient ajouté');
        this.selectedFile = null;
      },
      error: () => this.toastService.error('Erreur lors de l\'ajout du patient')
    });
  }

  openEditModal(patient: any) {
    this.editingPatient = { ...patient };
    this.newPatient = { ...patient };
    this.selectedFile = null;
    this.showAddModal = true;
  }

  updatePatient() {
    if (!this.editingPatient || !this.editingPatient.id) return;
    const formData = new FormData();
    for (const key in this.newPatient) {
      if (this.newPatient[key] !== undefined && this.newPatient[key] !== null && key !== 'showDetails') {
        formData.append(key, this.newPatient[key]);
      }
    }
    if (this.selectedFile) {
      formData.append('photo', this.selectedFile);
    }

    this.patientService.updatePatient(this.editingPatient.id, formData).subscribe({
      next: () => {
        this.loadPatients();
        this.showAddModal = false;
        this.toastService.success('Patient mis à jour');
        this.selectedFile = null;
      },
      error: () => this.toastService.error('Erreur lors de la mise à jour')
    });
  }

  deletePatient(patient: any) {
    if (confirm(`Supprimer ${patient.name} ?`)) {
      this.patientService.deletePatient(patient.id).subscribe({
        next: () => {
          this.loadPatients();
          this.toastService.success('Patient supprimé');
        },
        error: () => this.toastService.error('Erreur lors de la suppression')
      });
    }
  }

  toggleDetails(patient: any) {
    patient.showDetails = !patient.showDetails;
  }
}