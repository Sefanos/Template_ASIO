import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';

// Import the modular components
import { PatientRecordHeaderComponent } from '../../../components/doc_components/patient-record/patient-record-header/patient-record-header.component';
import { PrintOptionsComponent } from '../../../components/doc_components/patient-record/print-options/print-options.component';
import { PatientAlertsComponent } from '../../../components/doc_components/patient-record/patient-alerts/patient-alerts.component';
import { PatientInfoHeaderComponent } from '../../../components/doc_components/patient-record/patient-info-header/patient-info-header.component';
import { PatientTabsComponent } from '../../../components/doc_components/patient-record/patient-tabs/patient-tabs.component';
import { TabSummaryComponent } from '../../../components/doc_components/patient-record/tab-summary/tab-summary.component';
import { TabTimelineComponent } from '../../../components/doc_components/patient-record/tab-timeline/tab-timeline.component';
import { TabNotesComponent } from '../../../components/doc_components/patient-record/tab-notes/tab-notes.component';
import { TabAppointmentsComponent } from '../../../components/doc_components/patient-record/tab-appointments/tab-appointments.component';
import { TabPrescriptionsComponent } from '../../../components/doc_components/patient-record/tab-prescriptions/tab-prescriptions.component';
import { PatientNotFoundComponent } from '../../../components/doc_components/patient-record/patient-not-found/patient-not-found.component';
import { TabMedicalHistoryComponent } from '../../../components/doc_components/patient-record/tab-medical-history/tab-medical-history.component';
import { TabLabResultsComponent } from '../../../components/doc_components/patient-record/tab-lab-results/tab-lab-results.component';
import { TabDocumentsComponent } from '../../../components/doc_components/patient-record/tab-documents/tab-documents.component';
import { TabImagingComponent } from '../../../components/doc_components/patient-record/tab-imaging/tab-imaging.component';

// Import models and services
import { Patient } from '../../../models/patient.model';
import {
  VitalSign,
  Medication,
  Condition,
  LabResult,
  Appointment,
  TimelineEvent,
  Note
} from '../../../models/patient-record.model';
import { PatientService } from '../../../shared/services/patient.service';
import { PatientDataUtilsService } from '../../../shared/services/patient-data-utils.service';
import { 
  PatientMedicalService, 
  PatientMedicalSummary,
  PatientInfo, 
  MedicalOverview,
  TimelineEvent as MedicalTimelineEvent 
} from '../../../services/doc-services/patient-medical.service';

@Component({
  selector: 'app-patient-record',
  standalone: true,  imports: [
    CommonModule, 
    FormsModule,
    PatientRecordHeaderComponent,
    PrintOptionsComponent,
    PatientAlertsComponent,
    PatientInfoHeaderComponent,
    PatientTabsComponent,
    TabSummaryComponent,
    TabTimelineComponent,
    TabNotesComponent,
    TabAppointmentsComponent,
    TabPrescriptionsComponent,
    TabMedicalHistoryComponent,
    PatientNotFoundComponent,
    TabLabResultsComponent,
    TabDocumentsComponent,
    TabImagingComponent
  ],
  templateUrl: './patient-record.component.html',
  styleUrl: './patient-record.component.css'
})
export class PatientRecordComponent implements OnInit {
  // Page state
  patientId: number | null = null;
  patient: Patient | null = null;  patientInfo: PatientInfo | null = null;
  medicalSummary: MedicalOverview | null = null;
  activeTab: string = 'summary';
  showPrintOptions: boolean = false;
  loading: boolean = true;
  error: boolean = false;
  errorMessage: string = '';
    // Breadcrumbs
  breadcrumbs = [
    { label: 'Patient Management', route: '/doctor/patients' },
    { label: 'Medical Record', route: null, current: true }
  ];


  // Transformed data for components
  vitals: VitalSign[] = [];
  medications: Medication[] = [];
  conditions: Condition[] = [];
  labResults: LabResult[] = [];
  appointments: Appointment[] = [];
  timelineEvents: TimelineEvent[] = [];
  patientNotes: Note[] = [];
  
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private patientService: PatientService, 
    private patientMedicalService: PatientMedicalService,
    private dataUtils: PatientDataUtilsService,
    private cdr: ChangeDetectorRef
  ) {}
    ngOnInit(): void {
    console.log('PatientRecordComponent initialized');
    this.loadPatientData();
  }

  /**
   * Load patient data from the route parameters
   */
  private loadPatientData(): void {
    this.route.paramMap.subscribe((params) => {
      const idParam = params.get('patientId');
      console.log('Route patientId parameter:', idParam);
      
      if (idParam) {
        this.patientId = parseInt(idParam, 10);
        
        if (isNaN(this.patientId)) {
          console.error('Invalid patient ID:', idParam);
          this.error = true;
          this.errorMessage = 'Invalid patient ID provided';
          this.loading = false;
          return;
        }
          console.log('Loading medical data for patient ID:', this.patientId);
        this.loading = true;
          // Load the patient medical summary from our new service
        this.patientMedicalService.getPatientMedicalSummary(this.patientId, true) // Force refresh to avoid cache issues
          .subscribe({            next: (response: any) => {
              console.log('Received API response (after service transformation):', response);
              
              // The service already transforms the response and extracts the data
              // So 'response' here is the actual medical summary data, not the wrapped response
              const summary = response;
              
              if (summary) {
                // Store the raw API response data with more flexible field mapping
                this.patientInfo = summary.basic_info || summary.patient || summary;
                this.medicalSummary = summary.statistics || summary.stats || summary;
                
                console.log('Patient info extracted:', this.patientInfo);
                console.log('Medical summary extracted:', this.medicalSummary);
                
                // Create a patient object from the medical summary
                const transformedPatient = this.transformPatientFromSummary(summary);
                
                if (transformedPatient) {
                  this.patient = transformedPatient;
                  console.log('Successfully transformed patient:', transformedPatient);
                  // Also process additional data for child components
                  this.processPatientData();
                } else {
                  console.error('Failed to transform patient data - creating fallback patient');
                  // Create a fallback patient object
                  this.patient = {
                    id: this.patientId,
                    name: 'Patient ' + this.patientId,
                    email: '',
                    phone: '',
                    gender: '',
                    dob: '',
                    address: '',
                    photo: '',
                    status: 'Active',
                    allergies: [],
                    conditions: [],
                    medications: [],
                    alerts: [],
                    vitalSigns: [],
                    labResults: [],
                    notes: [],
                    appointments: [],
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  } as Patient;
                  this.processPatientData();
                }
              } else {
                console.error('No medical summary data returned for patient');
                this.error = true;
                this.errorMessage = 'Could not load patient data';
                this.loading = false;
              }
            },            error: (err: any) => {
              console.error('Error loading patient medical data:', err);
              
              // Handle different types of errors
              if (err.status === 404) {
                this.error = true;
                this.errorMessage = 'Patient not found';
              } else if (err.status === 401 || err.status === 403) {
                this.error = true;
                this.errorMessage = 'Access denied to patient records';
              } else if (err.status === 0) {
                this.error = true;
                this.errorMessage = 'Network connection error. Please check your internet connection.';
              } else if (err.status >= 500) {
                this.error = true;
                this.errorMessage = 'Server error. Please try again later.';
              } else {
                this.error = true;
                this.errorMessage = err.error?.message || 'Error loading patient data';
              }
              
              this.loading = false;
            },
            complete: () => {
              this.loading = false;
            }
          });
      } else {
        console.error('No patient ID in route parameters');
        this.error = true;
        this.errorMessage = 'Invalid patient ID';
        this.loading = false;
      }
    });
    
    // If no data after 3 seconds, show error state
    setTimeout(() => {
      if (this.loading && !this.patient) {
        console.error('Timeout loading patient data');
        this.error = true;
        this.errorMessage = 'Timeout loading patient data';
        this.loading = false;
      }
    }, 5000);
  }  /**
   * Transform PatientMedicalSummary to Patient model for backwards compatibility
   */
  private transformPatientFromSummary(summary: any): Patient | null {
    // Add comprehensive null safety checks
    if (!summary) {
      console.warn('PatientMedicalSummary is null or undefined');
      return null;
    }
    
    console.log('Summary keys:', Object.keys(summary));
    console.log('Summary structure:', summary);
    
    let patientInfo = null;
    
    // Try to find patient info in different possible locations
    if (summary.basic_info) {
      patientInfo = summary.basic_info;
      console.log('Found basic_info:', patientInfo);
    } else if (summary.patient) {
      patientInfo = summary.patient;
      console.log('Found patient:', patientInfo);
    } else if (summary.patientInfo) {
      patientInfo = summary.patientInfo;
      console.log('Found patientInfo:', patientInfo);
    } else if (summary.data && summary.data.basic_info) {
      patientInfo = summary.data.basic_info;
      console.log('Found data.basic_info:', patientInfo);
    } else {
      console.warn('No patient info found in expected locations. Trying to use summary directly...');
      // Try to use summary directly if it has patient-like properties
      if (summary.id || summary.full_name || summary.name || summary.email) {
        patientInfo = summary;
        console.log('Using summary as patient info:', patientInfo);
      } else {
        console.error('No valid patient data found in summary');
        return null;
      }
    }
    
    // Create patient object with comprehensive null safety
    const patient = {
      id: patientInfo?.id || this.patientId || 0,
      name: patientInfo?.full_name || patientInfo?.name || 'Unknown Patient',
      email: patientInfo?.email || '',
      phone: patientInfo?.phone || '',
      gender: patientInfo?.gender || '',
      dob: patientInfo?.birthdate || patientInfo?.dob || '',
      address: patientInfo?.address || '',
      photo: patientInfo?.profile_image || patientInfo?.photo || '',
      status: patientInfo?.status || 'Active',
      
      // Medical data from API response (try different locations)
      allergies: summary.active_alerts || summary.allergies || [],
      conditions: summary.medical_history || summary.conditions || [],
      medications: summary.active_medications || summary.medications || [],
      alerts: summary.active_alerts || summary.alerts || [],
      vitalSigns: summary.recent_vitals || summary.vitals || [],
      labResults: summary.recent_lab_results || summary.labResults || [],
      notes: summary.recent_notes || summary.notes || [],
      appointments: summary.appointments?.upcoming || summary.appointments || [],
      medicalHistory: summary.medical_history || [],
      
      // Metadata with null safety
      created_at: patientInfo?.registration_date || patientInfo?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Patient;
    
    console.log('Successfully transformed patient:', patient);
    return patient;
  }
  
  /**
   * Process patient data using the utility service
   */
  private processPatientData(): void {
    if (!this.patient) {
      console.error('Cannot process patient data: patient is null');
      return;
    }
    
    try {
      // Log the raw patient object to verify data is available
      console.log('Raw patient data to be processed:', JSON.stringify({
        id: this.patient.id,
        name: this.patient.name,
        dob: this.patient.dob,
        phone: this.patient.phone
      }));
      
      // Use the data utils service to transform the patient data
      const transformedData = this.dataUtils.transformPatientData(this.patient);
      
      // Assign all transformed data to component properties
      this.vitals = transformedData.vitals;
      this.medications = transformedData.medications;
      this.conditions = transformedData.conditions;
      this.labResults = transformedData.labResults;
      this.appointments = transformedData.appointments;
      this.timelineEvents = transformedData.timelineEvents;
      this.patientNotes = transformedData.patientNotes;      
      // Removed forced change detection to prevent Angular assertion errors
      // Angular will automatically detect changes when needed
    } catch (error) {
      console.error('Error transforming patient data:', error);
      this.error = true;
      this.errorMessage = 'Error processing patient data';
    }
  }
  
  /**
   * Set the active tab
   */  setActiveTab(tab: string): void {
    console.log(`Switching to tab: ${tab}`);
    this.activeTab = tab;
    
    // Load tab-specific data if needed
    this.loadTabData(tab);
    
    // Removed forced change detection to prevent Angular assertion errors
  }
  
  /**
   * Load data specific to a tab (lazy loading)
   */
  private loadTabData(tab: string): void {
    if (!this.patientId) return;
    
    switch (tab) {
      case 'timeline':
        this.patientMedicalService.getPatientTimeline(this.patientId)
          .subscribe(events => {
            console.log(`Loaded ${events.length} timeline events`);
            // Transform timeline events to match the expected format
            // Will need to implement this transformation
          });
        break;
          case 'notes':
        // Notes will be loaded directly by the tab-notes component
        console.log('Notes tab selected - component will handle data loading');
        break;
        
      // Add more cases for other tabs as needed
    }
  }
  
  /**
   * Navigate back to patient list
   */
  goBackToPatientList(): void {
    this.router.navigate(['/doctor/patients']);
  }
  
  /**
   * Navigate to prescription page
   */
  newPrescription(): void {
    this.router.navigate(['/doctor/prescription'], { 
      queryParams: { patientId: this.patientId } 
    });
  }
  
  /**
   * Navigate to appointment calendar
   */
  scheduleAppointment(): void {
    this.router.navigate(['/doctor/calendar'], { 
      queryParams: { patientId: this.patientId } 
    });
  }
  
  /**
   * Send a message to the patient
   */
  sendMessage(): void {
    console.log(`Sending message to patient ${this.patientId}`);
  }
  
  /**
   * Order new lab tests
   */
  orderNewTests(): void {
    console.log(`Ordering new tests for patient ${this.patientId}`);  }
  
  /**
   * Toggle print options visibility
   */
  togglePrintOptions(): void {
    this.showPrintOptions = !this.showPrintOptions;
  }
  
  /**
   * Print a section of the patient record
   */
  printSection(section: string): void {
    console.log(`Printing ${section} for patient ${this.patientId}`);
    this.showPrintOptions = false;
    // In a real app, this would generate a printable view of the selected section
  }
  
  /**
   * Refresh all patient data
   */
  refreshPatientData(): void {
    if (this.patientId) {
      this.loading = true;
      this.patientMedicalService.getPatientMedicalSummary(this.patientId, true) // force refresh
        .subscribe({
          next: (summary) => {
            if (summary) {
              this.patientInfo = summary.patient;
              this.medicalSummary = summary.medical_summary;
              this.patient = this.transformPatientFromSummary(summary);
              this.processPatientData();
            }
            this.loading = false;
          },
          error: (err) => {
            console.error('Error refreshing patient data:', err);
            this.loading = false;
          }
        });
    }
  }  getTabCounts(): { [key: string]: number } {
  return {
    'summary': 0,
    'timeline': this.timelineEvents?.length || 0,
    'history': this.conditions?.length || 0,
    'lab-results': this.getCriticalLabResultsCount(),
    'prescriptions': this.medications?.length || 0,
    'documents': 0, // Will be loaded dynamically by the tab component
    'imaging': 0, // Will be loaded dynamically by the tab component
    'notes': this.patientNotes?.length || 0,
    'appointments': this.appointments?.length || 0,
    'billing': 0
  };
}
  // Helper methods for tab counts
  getLabResultsCount(): number {
    return this.labResults?.length || 0;
  }

  getCriticalLabResultsCount(): number {
    return this.labResults?.filter(lab => {
      const parameters = lab.structured_results?.results || [];
      return parameters.some(param => param.status === 'critical');
    }).length || 0;
  }

  getActiveMedicationsCount(): number {
    return this.patient?.medications?.length || 0;
  }

  getUpcomingAppointmentsCount(): number {
    return this.patient?.appointments?.length || 0;
  }

  /**
   * Handle when a new note is added in the notes tab
   */
  onNoteAdded(newNote: Note): void {
    console.log('New note added:', newNote);
    // Add the new note to our local array if it's not already there
    if (!this.patientNotes.find(note => note.id === newNote.id)) {
      this.patientNotes.unshift(newNote);
    }
    // Update tab counts
    console.log(`Notes count updated to: ${this.patientNotes.length}`);
  }
}
