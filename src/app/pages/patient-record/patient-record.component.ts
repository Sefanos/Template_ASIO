import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';

// Import the modular components
import { PatientRecordHeaderComponent } from '../../components/patient-record/patient-record-header/patient-record-header.component';
import { PrintOptionsComponent } from '../../components/patient-record/print-options/print-options.component';
import { QuickNoteFormComponent } from '../../components/patient-record/quick-note-form/quick-note-form.component';
import { PatientAlertsComponent } from '../../components/patient-record/patient-alerts/patient-alerts.component';
import { PatientInfoHeaderComponent } from '../../components/patient-record/patient-info-header/patient-info-header.component';
import { PatientTabsComponent } from '../../components/patient-record/patient-tabs/patient-tabs.component';
import { TabSummaryComponent } from '../../components/patient-record/tab-summary/tab-summary.component';
import { TabTimelineComponent } from '../../components/patient-record/tab-timeline/tab-timeline.component';
import { TabNotesComponent } from '../../components/patient-record/tab-notes/tab-notes.component';
import { TabAppointmentsComponent } from '../../components/patient-record/tab-appointments/tab-appointments.component';
import { TabPrescriptionsComponent } from '../../components/patient-record/tab-prescriptions/tab-prescriptions.component';
import { PatientNotFoundComponent } from '../../components/patient-record/patient-not-found/patient-not-found.component';

// Import models and services
import { Patient } from '../../models/patient.model';
import {
  VitalSign,
  Medication,
  Condition,
  LabResult,
  Appointment,
  TimelineEvent,
  Note
} from '../../models/patient-record.model';
import { PatientService } from '../../services/patient.service';
import { PatientDataUtilsService } from '../../services/patient-data-utils.service';

@Component({
  selector: 'app-patient-record',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    PatientRecordHeaderComponent,
    PrintOptionsComponent,
    QuickNoteFormComponent,
    PatientAlertsComponent,
    PatientInfoHeaderComponent,
    PatientTabsComponent,
    TabSummaryComponent,
    TabTimelineComponent,
    TabNotesComponent,
    TabAppointmentsComponent,
    TabPrescriptionsComponent,
    PatientNotFoundComponent
  ],
  templateUrl: './patient-record.component.html',
  styleUrl: './patient-record.component.css'
})
export class PatientRecordComponent implements OnInit {
  // Page state
  patientId: number | null = null;
  patient: Patient | null = null;
  activeTab: string = 'summary';
  quickNote: string = '';
  showQuickNoteForm: boolean = false;
  showPrintOptions: boolean = false;
  loading: boolean = true; 

  // Transformed data for components
  vitals: VitalSign[] = [];
  medications: Medication[] = [];
  conditions: Condition[] = [];
  labResults: LabResult[] = [];
  appointments: Appointment[] = [];
  timelineEvents: TimelineEvent[] = [];
  patientNotes: Note[] = [];
  
  
  // Inject services using modern Angular DI pattern
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private patientService = inject(PatientService);
  private dataUtils = inject(PatientDataUtilsService);
  private cdr = inject(ChangeDetectorRef);
  
  constructor() {}
  
  ngOnInit(): void {
    this.loadPatientData();
  }

  /**
   * Load patient data from the route parameters
   */
  private loadPatientData(): void {
    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');
      if (idParam) {
        this.patientId = parseInt(idParam, 10);
        this.loading = true;
        
        // First try to get data from service
        this.patientService.getPatientById(this.patientId)
          .subscribe({
            next: (patient) => {
              if (patient) {
                this.patient = patient;
                this.processPatientData();
              } else {
                // Fallback to using sample patient if service returns null
                console.log('Using sample patient data as fallback');
        
              }
            },
            error: (err) => {
              console.error('Error loading patient data:', err);
            },
            complete: () => {
              this.loading = false;
            }
          });
      } else {
        // Use sample data if no ID in route
        Error('No patient ID in route parameters');
      }
    });
    
    // If no route param is available after 1 second, use sample data
    setTimeout(() => {
      if (this.loading && !this.patient) {
        console.log('No route param or slow response - using sample data');
      }
    }, 1000);
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
      
      // Force change detection to update the view
      this.cdr.detectChanges();
      
      // Additional forced update after a small delay to ensure all child components are updated
      setTimeout(() => {
        this.cdr.detectChanges();
      }, 100);
    } catch (error) {
      console.error('Error transforming patient data:', error);
    }
  }
  
  /**
   * Set the active tab
   */
  setActiveTab(tab: string): void {
    console.log(`Switching to tab: ${tab}`);
    this.activeTab = tab;
    // Force change detection when tab changes
    this.cdr.detectChanges();
  }
  
  /**
   * Navigate back to patient list
   */
  goBackToPatientList(): void {
    this.router.navigate(['/patients']);
  }
  
  /**
   * Navigate to prescription page
   */
  newPrescription(): void {
    this.router.navigate(['/prescription'], { 
      queryParams: { patientId: this.patientId } 
    });
  }
  
  /**
   * Navigate to appointment calendar
   */
  scheduleAppointment(): void {
    this.router.navigate(['/calendar'], { 
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
    console.log(`Ordering new tests for patient ${this.patientId}`);
  }
  
  /**
   * Toggle quick note form visibility
   */
  toggleQuickNoteForm(): void {
    this.showQuickNoteForm = !this.showQuickNoteForm;
  }
  
  /**
   * Save a quick note to patient record
   */
  saveQuickNote(): void {
    if (this.quickNote.trim() && this.patientId) {
      this.patientService.addPatientNote(this.patientId, this.quickNote)
        .subscribe({
          next: (success) => {
            if (success) {
              // Refresh patient data to show the new note
              this.loadPatientData();
              this.quickNote = '';
              this.showQuickNoteForm = false;
            }
          },
          error: (err) => {
            console.error('Error saving note:', err);
          }
        });
    }
  }
  
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
}