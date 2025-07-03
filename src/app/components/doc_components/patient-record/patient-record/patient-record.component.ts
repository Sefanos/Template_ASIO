import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';

// Import all subcomponents
import { PatientRecordHeaderComponent } from '../patient-record-header/patient-record-header.component';
import { PrintOptionsComponent } from '../print-options/print-options.component';
import { QuickNoteFormComponent } from '../quick-note-form/quick-note-form.component';
import { PatientAlertsComponent } from '../patient-alerts/patient-alerts.component';
import { PatientInfoHeaderComponent } from '../patient-info-header/patient-info-header.component';
import { PatientTabsComponent } from '../patient-tabs/patient-tabs.component';
import { TabSummaryComponent } from '../tab-summary/tab-summary.component';
import { TabTimelineComponent } from '../tab-timeline/tab-timeline.component';
import { TabNotesComponent } from '../tab-notes/tab-notes.component';
import { TabPrescriptionsComponent } from '../tab-prescriptions/tab-prescriptions.component';
import { PatientNotFoundComponent } from '../patient-not-found/patient-not-found.component';
import { AlertModalComponent } from '../alert-modal/alert-modal.component';
import { Alert } from '../../../../models/alert.model';
import { AlertService } from '../../../../services/doc-services/alert.service';

@Component({
  selector: 'app-patient-record',
  imports: [
    CommonModule,
    PatientRecordHeaderComponent,
    PrintOptionsComponent,
    QuickNoteFormComponent,
    PatientAlertsComponent,
    PatientInfoHeaderComponent,
    PatientTabsComponent,
    TabSummaryComponent,
    TabTimelineComponent,
    TabNotesComponent,
    TabPrescriptionsComponent,
    PatientNotFoundComponent,
    AlertModalComponent
  ],
  templateUrl: './patient-record.component.html',
})
export class PatientRecordComponent implements OnInit {
  // Patient data
  patientId: number = 0;
  patient: any = null; // Replace with a proper patient interface
  loading: boolean = true;
  error: boolean = false;

  // UI state
  activeTab: string = 'summary';
  showPrintOptions: boolean = false;
  showQuickNote: boolean = false;
  showAlertsModal: boolean = false;
  quickNote: string = '';

  // Patient data
  allergies: string[] = [];
  alerts: Alert[] = [];
  vitals: any[] = [];
  medications: any[] = [];
  conditions: any[] = [];
  labResults: any[] = [];
  appointments: any[] = [];
  timelineEvents: any[] = [];
  notes: any[] = [];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.patientId = +this.route.snapshot.paramMap.get('id')!;
    this.loadPatientData();
  }

  loadPatientData(): void {
    // In a real app, this would call a service to fetch patient data
    // For now, simulate loading time and error handling
    this.loading = true;
    setTimeout(() => {
      // Simulate patient data
      if (this.patientId > 0) {
        this.patient = {
          id: this.patientId,
          name: 'John Smith',
          dob: '1980-05-15',
          phone: '(555) 123-4567'
        };

        this.allergies = ['Penicillin', 'Peanuts'];
        
        // Load alerts from API
        this.loadPatientAlerts();

        // Populate other data as needed
        this.loading = false;
      } else {
        this.error = true;
        this.loading = false;
      }
    }, 1000);
  }

  loadPatientAlerts(): void {
    console.log('Loading patient alerts for patient ID:', this.patientId);
    this.alertService.getPatientAlerts(this.patientId).subscribe({
      next: (alerts) => {
        console.log('Received alerts from API:', alerts);
        console.log('Alert count breakdown:', {
          total: alerts.length,
          active: alerts.filter(a => a.isActive).length,
          inactive: alerts.filter(a => !a.isActive).length
        });
        this.alerts = alerts;
        console.log('Updated this.alerts to:', this.alerts);
        console.log('Current modal alerts binding will receive:', this.alerts);
      },
      error: (error) => {
        console.error('Error loading patient alerts:', error);
        // Keep existing alerts or set empty array
        this.alerts = [];
      }
    });
  }

  // Navigation and state management
  goBackToPatientList(): void {
    this.router.navigate(['/doctor/patients']);
  }

  togglePrintOptions(): void {
    this.showPrintOptions = !this.showPrintOptions;
  }

  toggleQuickNote(): void {
    this.showQuickNote = !this.showQuickNote;
    if (!this.showQuickNote) {
      this.quickNote = '';
    }
  }

  toggleAlertsModal(): void {
    this.showAlertsModal = !this.showAlertsModal;
    // When opening the modal, refresh alerts to ensure latest data
    if (this.showAlertsModal) {
      this.loadPatientAlerts();
    }
  }

  onAlertsUpdated(updatedAlerts: Alert[]): void {
    console.log('onAlertsUpdated called with:', updatedAlerts);
    console.log('Current alerts before refresh:', this.alerts);
    
    // First, immediately use the updated alerts from the modal
    this.alerts = [...updatedAlerts];
    console.log('Updated this.alerts immediately to:', this.alerts);
    
    // Then, also refresh from API after a short delay to ensure backend is up-to-date
    setTimeout(() => {
      console.log('Refreshing alerts from API after delay...');
      this.loadPatientAlerts();
    }, 100);
  }

  onTabChange(tab: string): void {
    this.activeTab = tab;
  }

  onQuickNoteChange(note: string): void {
    this.quickNote = note;
  }

  saveQuickNote(): void {
    // In a real app, this would call a service to save the note
    console.log('Saving quick note:', this.quickNote);
    this.toggleQuickNote();
  }

  handlePrintSection(section: string): void {
    console.log('Printing section:', section);
    this.showPrintOptions = false;
    // In a real app, this would trigger printing of the selected section
  }

  // Quick actions
  onNewPrescription(): void {
    this.router.navigate(['/doctor/prescriptions/new'], { queryParams: { patientId: this.patientId } });
  }

  onScheduleAppointment(): void {
    this.router.navigate(['/doctor/appointments/new'], { queryParams: { patientId: this.patientId } });
  }

  onSendMessage(): void {
    this.router.navigate(['/doctor/messages/new'], { queryParams: { patientId: this.patientId } });
  }
}