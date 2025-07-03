import { Component, Input, OnChanges, SimpleChanges, ChangeDetectorRef, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

// Import all card components used in the template
import { VitalSignsCardComponent } from '../vital-signs-card/vital-signs-card.component';
import { MedicationsCardComponent } from '../medications-card/medications-card.component';
import { MedicalHistoryCardComponent } from '../medical-history-card/medical-history-card.component';
import { LabResultsCardComponent } from '../lab-results-card/lab-results-card.component';
import { AppointmentHistoryCardComponent } from '../appointment-history-card/appointment-history-card.component';
import { DoctorNotesCardComponent } from '../doctor-notes-card/doctor-notes-card.component';

@Component({
  selector: 'app-tab-summary',
  standalone: true,
  imports: [
    CommonModule,
    VitalSignsCardComponent,
    MedicationsCardComponent,
    MedicalHistoryCardComponent,
    LabResultsCardComponent,
    AppointmentHistoryCardComponent,
    DoctorNotesCardComponent
  ],
  templateUrl: './tab-summary.component.html',
})
export class TabSummaryComponent implements OnChanges {
  // Legacy inputs for backward compatibility
  @Input() patient: any = null;
  @Input() vitals: any[] = [];
  @Input() medications: any[] = [];
  @Input() conditions: any[] = [];
  @Input() labResults: any[] = [];
  @Input() appointments: any[] = [];
  @Input() patientNotes: any[] = [];
  
  // New inputs for real API data
  @Input() patientId: number | null = null;
  @Input() medicalSummary: any = null;
  @Input() patientInfo: any = null;
  @Input() recentVitals: any[] = [];
  @Input() activeMedications: any[] = [];
  @Input() medicalHistory: any[] = [];
  @Input() recentNotes: any[] = [];
  @Input() activeAlerts: any[] = [];
  
  // Output for tab change event
  @Output() tabChange = new EventEmitter<string>();
  
  // Computed properties for display
  get displayVitals(): any[] {
    return this.recentVitals?.length > 0 ? this.recentVitals : this.vitals;
  }
  
  get displayMedications(): any[] {
    return this.activeMedications?.length > 0 ? this.activeMedications : this.medications;
  }
  
  get displayConditions(): any[] {
    return this.medicalHistory?.length > 0 ? this.medicalHistory : this.conditions;
  }
  
  get displayNotes(): any[] {
    return this.recentNotes?.length > 0 ? this.recentNotes : this.patientNotes;
  }
  
  get displayAlerts(): any[] {
    return this.activeAlerts || [];
  }
  
  constructor(private cdr: ChangeDetectorRef) {}
  
  ngOnChanges(changes: SimpleChanges): void {
    // Log when input data changes to help with debugging
    const changedInputs = Object.keys(changes);
    console.log('TabSummaryComponent inputs changed:', changedInputs.join(', '));
    
    // Log lengths of arrays to verify data is received
    if (changedInputs.length > 0) {
      console.log('TabSummaryComponent data status:', {
        patient: this.patient ? 'present' : 'missing',
        recentVitals: this.recentVitals?.length || 0,
        activeMedications: this.activeMedications?.length || 0,
        medicalHistory: this.medicalHistory?.length || 0,
        recentNotes: this.recentNotes?.length || 0,
        activeAlerts: this.activeAlerts?.length || 0,
        medicalSummary: this.medicalSummary ? 'present' : 'missing'
      });
    }    
    // Force change detection
    setTimeout(() => {
      this.cdr.detectChanges();
    }, 0);
  }
  
  // Handle navigation from child components
  onNavigateToTab(tabName: string): void {
    this.tabChange.emit(tabName);
  }

  /**
   * Handle when a new note is added from the doctor notes card
   */
  onNoteAdded(newNote: any): void {
    console.log('New note added in summary tab:', newNote);
    // Add the new note to our local arrays
    this.patientNotes.unshift(newNote);
    this.recentNotes.unshift(newNote);
    
    // Emit to parent component (patient record) for further handling
    // The parent can handle the API call and refresh other components
    console.log('Note added - summary tab updated');
  }
}