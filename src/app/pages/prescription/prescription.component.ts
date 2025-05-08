import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';

// Import our custom components
import { PatientInfoHeaderComponent } from '../../components/prescriptionRx/patient-info-header/patient-info-header.component';
import { PrescriptionFormComponent } from '../../components/prescriptionRx/prescription-form/prescription-form.component';
import { CurrentPrescriptionsComponent } from '../../components/prescriptionRx/current-prescriptions/current-prescriptions.component';

// Import shared models and services
import { Prescription } from '../../models/prescription.model';
import { PatientService } from '../../services/patient.service';
import { Patient } from '../../models/patient.model';

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
  patient: Patient | null = null;
  loading: boolean = false;
  
  // UI state
  showPrescriptionForm: boolean = true;
  currentPrescriptionToEdit: Prescription | null = null;
  
  // Patient search
  searchQuery: string = '';
  searchResults: Patient[] = [];
  isSearching: boolean = false;
  showSearchResults: boolean = false;
  noResultsFound: boolean = false;
  
  constructor(
    private route: ActivatedRoute,
    private patientService: PatientService
  ) {}
  
  ngOnInit(): void {
    // Get patient ID from query parameters
    this.route.queryParams.subscribe(params => {
      if (params['patientId']) {
        this.patientId = parseInt(params['patientId'], 10);
        this.loadPatientData();
      }
    });
  }
  
  private loadPatientData(): void {
    if (!this.patientId) return;
    
    this.loading = true;
    
    this.patientService.getPatientById(this.patientId).subscribe({
      next: (patient) => {
        this.patient = patient;
        if (patient) {
          this.patientName = patient.name;
          this.patientDob = patient.dob;
        } else {
          this.patientName = 'Unknown Patient';
          this.patientDob = '';
        }
      },
      error: (error) => {
        console.error('Error loading patient data:', error);
        this.patientName = 'Unknown Patient';
        this.patientDob = '';
      },
      complete: () => {
        this.loading = false;
      }
    });
  }
  
  searchPatients(): void {
    if (!this.searchQuery.trim()) {
      this.searchResults = [];
      this.showSearchResults = false;
      this.noResultsFound = false;
      return;
    }
    
    this.isSearching = true;
    this.showSearchResults = true;
    
    this.patientService.getAllPatients().subscribe({
      next: (patients) => {
        const query = this.searchQuery.toLowerCase();
        this.searchResults = patients.filter(patient => 
          patient.name.toLowerCase().includes(query) || 
          patient.id.toString().includes(query)
        );
        this.noResultsFound = this.searchResults.length === 0;
      },
      error: (error) => {
        console.error('Error searching patients:', error);
        this.searchResults = [];
        this.noResultsFound = true;
      },
      complete: () => {
        this.isSearching = false;
      }
    });
  }
  
  selectPatient(patient: Patient): void {
    this.patientId = patient.id;
    this.patientName = patient.name;
    this.patientDob = patient.dob;
    this.patient = patient;
    this.searchQuery = '';
    this.searchResults = [];
    this.showSearchResults = false;
  }
  
  clearPatient(): void {
    this.patientId = null;
    this.patientName = '';
    this.patientDob = '';
    this.patient = null;
    this.currentPrescriptionToEdit = null;
  }
  
  onPrescriptionCreated(prescription: Prescription): void {
    console.log('Prescription created:', prescription);
    
    // Reset form and show success message
    this.showPrescriptionForm = false;
    setTimeout(() => {
      this.showPrescriptionForm = true;
      this.currentPrescriptionToEdit = null;
      
      // Force refresh of prescriptions list
      if (this.patientId) {
        // This would be handled by child component's ngOnChanges in a real implementation
        const currentPrescriptions = document.querySelector('app-current-prescriptions') as any;
        if (currentPrescriptions && currentPrescriptions.loadPrescriptions) {
          currentPrescriptions.loadPrescriptions();
        }
      }
    }, 100);
  }
  
  onPrescriptionUpdated(prescription: Prescription): void {
    console.log('Prescription updated:', prescription);
    
    // Reset form and edit state
    this.currentPrescriptionToEdit = null;
    
    // Force refresh of prescriptions list
    if (this.patientId) {
      // This would be handled by child component's ngOnChanges in a real implementation
      const currentPrescriptions = document.querySelector('app-current-prescriptions') as any;
      if (currentPrescriptions && currentPrescriptions.loadPrescriptions) {
        currentPrescriptions.loadPrescriptions();
      }
    }
  }
  
  onCancelPrescription(): void {
    this.currentPrescriptionToEdit = null;
  }
  
  onEditPrescription(prescription: Prescription): void {
    this.currentPrescriptionToEdit = prescription;
    console.log('Editing prescription:', prescription);
  }
}
