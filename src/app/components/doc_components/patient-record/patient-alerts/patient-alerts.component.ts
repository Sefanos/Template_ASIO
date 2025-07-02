import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Alert, AlertHelper } from '../../../../models/alert.model';
import { AlertService } from '../../../../services/doc-services/alert.service';

@Component({
  selector: 'app-patient-alerts',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './patient-alerts.component.html',
})
export class PatientAlertsComponent implements OnInit, OnChanges {
  @Input() patientId: number | null = null; // ✅ Change from allergies/alerts to patientId
  @Input() allergies: any[] = []; // ✅ Keep for backward compatibility but won't use
  @Input() alerts: any[] = []; // ✅ Keep for backward compatibility but won't use

  allAlerts: Alert[] = [];
  isLoading: boolean = false;
  error: string | null = null;

  constructor(private alertService: AlertService) {} // ✅ Inject AlertService

  ngOnInit() {
    this.loadAlertsFromAPI();
  }

  ngOnChanges(changes: SimpleChanges) {
    // Reload when patientId changes
    if (changes['patientId'] && this.patientId) {
      this.loadAlertsFromAPI();
    }
  }

  // Public method to force refresh - can be called from parent
  refreshAlerts() {
    this.loadAlertsFromAPI();
  }

  private loadAlertsFromAPI() {
    if (!this.patientId) {
      console.warn('⚠️ No patient ID provided to PatientAlertsComponent');
      return;
    }

    this.isLoading = true;
    this.error = null;

    console.log('🔍 PatientAlertsComponent: Loading alerts for patient:', this.patientId);

    this.alertService.getPatientAlerts(this.patientId).subscribe({
      next: (alerts) => {
        console.log('✅ PatientAlertsComponent: Received alerts:', alerts);
        
        // Filter to only show active alerts in the summary view
        this.allAlerts = alerts.filter(alert => alert.isActive);
        
        console.log('🔍 PatientAlertsComponent: Showing active alerts:', this.allAlerts);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ PatientAlertsComponent: Error loading alerts:', error);
        this.error = 'Failed to load alerts';
        this.allAlerts = [];
        this.isLoading = false;
      }
    });
  }

  getSeverityStyles(alert: Alert) {
    return AlertHelper.getSeverityStyles(alert.severity);
  }
}