import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

// Import our custom components
import { PatientInfoHeaderComponent } from '../../../components/doc_components/prescriptionRx/patient-info-header/patient-info-header.component';
import { PrescriptionFormComponent } from '../../../components/doc_components/prescriptionRx/prescription-form/prescription-form.component';
import { CurrentPrescriptionsComponent } from '../../../components/doc_components/prescriptionRx/current-prescriptions/current-prescriptions.component';

// Import shared models and services
import { Prescription } from '../../../models/prescription.model';
import { DoctorDashboardService, Patient as DoctorPatient } from '../../../services/doc-services/doctor-dashboard.service';

// ✅ FIXED: Move interface outside of class
interface ConfirmationModal {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  confirmButtonClass: string;
  onConfirm: () => void;
  onCancel: () => void;
  isProcessing: boolean;
}

@Component({
  selector: 'app-prescription',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PatientInfoHeaderComponent,
    PrescriptionFormComponent,
    CurrentPrescriptionsComponent
  ],
  templateUrl: './prescription.component.html',
  styleUrl: './prescription.component.css'
})
export class PrescriptionComponent implements OnInit {
  // Patient data
  patientId: number | null = null;
  patientName: string = '';
  patientDob: string = '';
  patient: DoctorPatient | null = null;
  loading: boolean = false;
  
  // UI state
  currentPrescriptionToEdit: Prescription | null = null;
  
  // Patient search
  searchQuery: string = '';
  searchResults: DoctorPatient[] = [];
  allPatients: DoctorPatient[] = [];
  patientsLoaded: boolean = false;
  isSearching: boolean = false;
  showSearchResults: boolean = false;
  noResultsFound: boolean = false;
  
  // Navigation context
  cameFromPatientRecord: boolean = false;

  // ViewChild reference
  @ViewChild(CurrentPrescriptionsComponent) currentPrescriptionsComponent!: CurrentPrescriptionsComponent;
  
  // ✅ FIXED: Confirmation modal state (moved after properties)
  confirmationModal: ConfirmationModal = {
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    confirmButtonClass: 'btn-primary',
    onConfirm: () => {},
    onCancel: () => {},
    isProcessing: false
  };
  
  constructor(
    private route: ActivatedRoute,
    private doctorDashboardService: DoctorDashboardService,
    private router: Router
  ) {}
  
  ngOnInit(): void {
    // Load all patients first, then handle route params
    this.loadAllPatients(() => {
      // Handle route parameters after patients are loaded
      this.route.queryParams.subscribe(params => {
        console.log('Route params:', params);
        
        // ✅ FIXED: Handle both patientId and patient_id
        const patientIdParam = params['patientId'] || params['patient_id'];
        if (patientIdParam) {
          this.patientId = parseInt(patientIdParam, 10);
          this.loadPatientData();
        }
        
        // Check if came from patient record
        if (params['from_patient_record'] === 'true') {
          this.cameFromPatientRecord = true;
          console.log('Navigation from patient record detected');
        }
        
        // If patient name is provided, set it temporarily
        if (params['patient_name']) {
          this.patientName = params['patient_name'];
        }
      });
    });
  }

  // ✅ UPDATED: Add callback to know when patients are loaded
  private loadAllPatients(callback?: () => void): void {
    console.log('Loading all patients...');
    
    this.doctorDashboardService.getMyPatients().subscribe({
      next: (response) => {
        console.log('Raw patients response:', response);
        
        const patients = this.extractPatientsFromResponse(response);
        console.log('Extracted patients:', patients);
        console.log('Patients count:', patients.length);
        
        this.allPatients = patients;
        this.patientsLoaded = true;
        
        // Debug each patient
        patients.forEach((patient, index) => {
          console.log(`Patient ${index + 1}:`, {
            id: patient.id,
            name: this.getPatientFullName(patient),
            personalInfo: patient.personal_info,
            user: patient.user
          });
        });
        
        if (callback) {
          callback();
        }
      },
      error: (error) => {
        console.error('Error loading patients for search:', error);
        this.allPatients = [];
        this.patientsLoaded = true;
        
        if (callback) {
          callback();
        }
      }
    });
  }

  // ✅ FIXED: Add proper method declaration
  private extractPatientsFromResponse(response: any): DoctorPatient[] {
    console.log('Extracting patients from response:', response);
    
    // Handle different response formats
    if (Array.isArray(response)) {
      return response;
    }
    
    if (response && typeof response === 'object') {
      // Paginated response format: { data: { data: [...patients] } }
      if (response.data && Array.isArray(response.data)) {
        console.log('Found patients in response.data (paginated)');
        return response.data;
      }
      
      // Direct data format: { data: [...patients] }
      if (Array.isArray(response.data)) {
        console.log('Found patients in response.data (direct)');
        return response.data;
      }
      
      // Nested pagination: response is the pagination object itself
      if (response.current_page && Array.isArray(response.data)) {
        console.log('Found patients in paginated response.data');
        return response.data;
      }
    }
    
    console.warn('Could not extract patients from response, returning empty array');
    return [];
  }

  // ✅ UPDATED: Load specific patient data (simplified)
  private loadPatientData(): void {
    if (!this.patientId) return;
    
    // Wait for patients to be loaded first
    if (!this.patientsLoaded) {
      console.log('Waiting for patients to load before finding specific patient...');
      setTimeout(() => this.loadPatientData(), 100);
      return;
    }
    
    this.loading = true;
    
    // Find patient in already loaded patients
    const foundPatient = this.allPatients.find(p => p.id === this.patientId);
    if (foundPatient) {
      console.log('Found patient in loaded list:', foundPatient);
      this.setPatientData(foundPatient);
    } else {
      console.error('Patient not found in doctor\'s patient list, ID:', this.patientId);
      this.patientName = 'Unknown Patient';
      this.patientDob = '';
    }
    
    this.loading = false;
  }

  // ✅ NEW: Helper to set patient data from DoctorPatient model
  private setPatientData(patient: DoctorPatient): void {
    this.patient = patient;
    this.patientName = this.getPatientFullName(patient);
    this.patientDob = patient.personal_info?.birthdate || '';
  }

  // ✅ UPDATED: Search patients using doctor's patients
  searchPatients(): void {
    console.log('Search triggered:', this.searchQuery);
    console.log('All patients available:', this.allPatients);
    console.log('Patients loaded:', this.patientsLoaded);
    
    if (!this.searchQuery.trim()) {
      this.searchResults = [];
      this.showSearchResults = false;
      this.noResultsFound = false;
      return;
    }
    
    // ✅ SAFETY CHECK: Ensure patients are loaded and is array
    if (!this.patientsLoaded) {
      console.log('Patients not loaded yet, waiting...');
      this.isSearching = true;
      this.showSearchResults = true;
      
      // Wait for patients to load
      setTimeout(() => {
        if (this.patientsLoaded) {
          this.searchPatients(); // Retry
        } else {
          this.isSearching = false;
          this.noResultsFound = true;
        }
      }, 500);
      return;
    }
    
    // ✅ ENSURE allPatients is an array
    if (!Array.isArray(this.allPatients)) {
      console.error('allPatients is not an array:', this.allPatients);
      this.allPatients = [];
      this.noResultsFound = true;
      this.showSearchResults = true;
      return;
    }
    
    this.isSearching = true;
    this.showSearchResults = true;
    
    // Simulate API delay for UX
    setTimeout(() => {
      try {
        const query = this.searchQuery.toLowerCase();
        console.log('Filtering patients with query:', query);
        
        this.searchResults = this.allPatients.filter(patient => {
          const fullName = this.getPatientFullName(patient).toLowerCase();
          const userId = patient.user?.name?.toLowerCase() || '';
          const patientId = patient.id.toString();
          
          const matches = fullName.includes(query) || 
                         userId.includes(query) ||
                         patientId.includes(query);
          
          if (matches) {
            console.log('Patient matches:', patient);
          }
          
          return matches;
        });
        
        console.log('Search results:', this.searchResults);
        this.noResultsFound = this.searchResults.length === 0;
        
      } catch (error) {
        console.error('Error during search:', error);
        this.searchResults = [];
        this.noResultsFound = true;
      } finally {
        this.isSearching = false;
      }
    }, 300);
  }
  
  // ✅ UPDATED: Better error handling for patient name
  getPatientFullName(patient: DoctorPatient): string {
    try {
      if (patient?.personal_info) {
        const name = patient.personal_info.name || '';
        const surname = patient.personal_info.surname || '';
        return `${name} ${surname}`.trim() || 'Unknown Patient';
      }
      return patient?.user?.name || 'Unknown Patient';
    } catch (error) {
      console.error('Error getting patient name:', error);
      return 'Unknown Patient';
    }
  }

  // ✅ UPDATED: Add error handling for patient selection
  selectPatient(patient: DoctorPatient): void {
    try {
      console.log('Selecting patient:', patient);
      
      this.patientId = patient.id;
      this.setPatientData(patient);
      this.searchQuery = '';
      this.searchResults = [];
      this.showSearchResults = false;
      
    } catch (error) {
      console.error('Error selecting patient:', error);
      alert('Error selecting patient. Please try again.');
    }
  }
  
  // ✅ NEW: Generic confirmation modal opener
  private openConfirmationModal(config: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    confirmButtonClass?: string;
    onConfirm: () => void;
  }): void {
    this.confirmationModal = {
      isOpen: true,
      title: config.title,
      message: config.message,
      confirmText: config.confirmText || 'Confirm',
      cancelText: config.cancelText || 'Cancel',
      confirmButtonClass: config.confirmButtonClass || 'bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors',
      onConfirm: config.onConfirm,
      onCancel: () => this.closeConfirmationModal(),
      isProcessing: false
    };
  }
  
  private closeConfirmationModal(): void {
    this.confirmationModal.isOpen = false;
    this.confirmationModal.isProcessing = false;
  }
  
  onModalConfirm(): void {
    this.confirmationModal.isProcessing = true;
    this.confirmationModal.onConfirm();
  }
  
  onModalCancel(): void {
    this.confirmationModal.onCancel();
  }
  
  // ✅ UPDATED: Clear patient with confirmation
  clearPatient(): void {
    const hasSelectedPatient = this.patientId && this.patientName;
    
    if (hasSelectedPatient) {
      this.openConfirmationModal({
        title: 'Change Patient',
        message: `Are you sure you want to select a different patient?\n\nCurrent patient: ${this.patientName}\n\nAny unsaved prescription data will be lost.`,
        confirmText: 'Yes, Change Patient',
        cancelText: 'Keep Current Patient',
        confirmButtonClass: 'bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md transition-colors',
        onConfirm: () => {
          this.performClearPatient();
        }
      });
    } else {
      this.performClearPatient();
    }
  }
  
  private performClearPatient(): void {
    this.patientId = null;
    this.patientName = '';
    this.patientDob = '';
    this.patient = null;
    this.currentPrescriptionToEdit = null;
    this.closeConfirmationModal();
    this.showSuccessMessage('Patient cleared. You can now search for a different patient.');
  }
  
  // ✅ UPDATED: Navigation with confirmation
  navigateBackToPatientRecord(): void {
    this.openConfirmationModal({
      title: 'Return to Patient Record',
      message: `Return to ${this.patientName}'s patient record?\n\nAny unsaved prescription changes will be lost.`,
      confirmText: 'Yes, Go Back',
      cancelText: 'Stay Here',
      confirmButtonClass: 'bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors',
      onConfirm: () => {
        this.performNavigateBack();
      }
    });
  }
  
  private performNavigateBack(): void {
    this.closeConfirmationModal();
    
    if (this.cameFromPatientRecord && this.patientId) {
      this.router.navigate(['/doctor/patient-record', this.patientId], {
        queryParams: { 
          tab: 'prescriptions',
          refresh: 'true'
        }
      });
    } else {
      this.router.navigate(['/doctor/patients']);
    }
  }
  
  // Add success/error message methods (same as other components)
  private showSuccessMessage(message: string): void {
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 translate-x-full';
    notification.innerHTML = `
      <div class="flex items-center">
        <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
        </svg>
        ${message}
      </div>
    `;
    
    document.body.appendChild(notification);
    setTimeout(() => notification.classList.remove('translate-x-full'), 100);
    setTimeout(() => {
      notification.classList.add('translate-x-full');
      setTimeout(() => document.body.removeChild(notification), 300);
    }, 3000);
  }
  
  // Update prescription event handlers
  onPrescriptionCreated(prescription: Prescription): void {
    console.log('Prescription created:', prescription);
    
    // Refresh the current prescriptions list
    if (this.currentPrescriptionsComponent) {
      this.currentPrescriptionsComponent.refreshPrescriptions();
    }
    
    // If came from patient record, navigate back
    if (this.cameFromPatientRecord) {
      this.showSuccessMessage('Prescription created successfully! Returning to patient record...');
      setTimeout(() => {
        this.navigateBackToPatientRecord();
      }, 1500);
      return;
    }
    
    // ✅ FIXED: Replace alert() with toast notification
    this.showSuccessMessage('Prescription created and signed successfully!');
  }

  onPrescriptionUpdated(prescription: Prescription): void {
    console.log('Prescription updated:', prescription);
    
    // Refresh the current prescriptions list
    if (this.currentPrescriptionsComponent) {
      this.currentPrescriptionsComponent.refreshPrescriptions();
    }
    
    // If came from patient record, navigate back
    if (this.cameFromPatientRecord) {
      this.showSuccessMessage('Prescription updated successfully! Returning to patient record...');
      setTimeout(() => {
        this.navigateBackToPatientRecord();
      }, 1500);
      return;
    }
    
    // ✅ FIXED: Replace alert() with toast notification
    this.showSuccessMessage('Prescription updated successfully!');
    this.currentPrescriptionToEdit = null;
  }

  onCancelPrescription(): void {
    this.currentPrescriptionToEdit = null;
    this.showSuccessMessage('Prescription editing cancelled');
  }

  onEditPrescription(prescription: Prescription): void {
    this.currentPrescriptionToEdit = prescription;
    this.showSuccessMessage(`Editing prescription for ${prescription.medication}`);
    console.log('Editing prescription:', prescription);
  }
}