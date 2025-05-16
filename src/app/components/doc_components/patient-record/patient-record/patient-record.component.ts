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

@Component({
  selector: 'app-patient-record',
  standalone: true,
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
    PatientNotFoundComponent
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
  quickNote: string = '';

  // Patient data
  allergies: string[] = [];
  alerts: any[] = [];
  vitals: any[] = [];
  medications: any[] = [];
  conditions: any[] = [];
  labResults: any[] = [];
  appointments: any[] = [];
  timelineEvents: any[] = [];
  notes: any[] = [];

  constructor(
    private router: Router,
    private route: ActivatedRoute
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
        this.alerts = [
          { type: 'warning', message: 'Patient has missed last 2 appointments' },
          { type: 'info', message: 'Pre-op clearance needed for scheduled surgery' }
        ];

        // Populate other data as needed
        this.loading = false;
      } else {
        this.error = true;
        this.loading = false;
      }
    }, 1000);
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