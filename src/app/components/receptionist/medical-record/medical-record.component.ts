import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { PatientService } from '../../../services/recepetionist-services/patient.service';
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

  itemsPerPage = 10;
  currentPage = 1;

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
    this.patientService.getPatients().subscribe({
      next: (data: any[]) => {
        this.patients = data.map(p => ({ ...p, showDetails: false }));
        this.applyFilters(); // Applique aussi les filtres
        this.updatePagedPatients(); // Met à jour la pagination
      },
      error: (err) => console.error('Erreur lors du chargement des patients', err)
    });
  }

  applyFilters() {
    this.filteredPatients = this.patients.filter(patient => {
      const matchesSearch =
        !this.searchQuery ||
        patient.name?.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        ('#' + patient.id).toLowerCase().includes(this.searchQuery.toLowerCase());

      const matchesStatus =
        !this.selectedStatus || patient.status === this.selectedStatus;

      return matchesSearch && matchesStatus;
    });

    this.currentPage = 1; // Réinitialiser à la première page après un filtre
    this.updatePagedPatients();
  }

  updatePagedPatients() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.pagedPatients = this.filteredPatients.slice(start, end);
  }

  goToPreviousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagedPatients();
    }
  }

  goToNextPage() {
    const maxPage = Math.ceil(this.filteredPatients.length / this.itemsPerPage);
    if (this.currentPage < maxPage) {
      this.currentPage++;
      this.updatePagedPatients();
    }
  }

  getPageNumbers(): number[] {
    const totalItems = this.filteredPatients.length;
    const totalPages = Math.ceil(totalItems / this.itemsPerPage);
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  goToPage(page: number) {
    this.currentPage = page;
    this.updatePagedPatients();
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
      if (this.newPatient[key] !== undefined && this.newPatient[key] !== null) {
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