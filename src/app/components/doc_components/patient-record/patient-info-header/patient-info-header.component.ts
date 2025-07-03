import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-patient-info-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './patient-info-header.component.html'
})
export class PatientInfoHeaderComponent {
  @Input() patientId: string | number | undefined;
  @Input() name: string = '';
  @Input() age: number | undefined;
  @Input() gender: string = '';
  @Input() phone: string = '';
  @Input() email: string = '';
  @Input() dob: string = '';
  @Input() patientData: any = null;

  constructor(private router: Router) {}

  // Get patient initials for avatar
  getInitials(): string {
    if (!this.name) return 'UK';
    
    const nameParts = this.name.trim().split(' ');
    if (nameParts.length >= 2) {
      return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
    }
    return nameParts[0].substring(0, 2).toUpperCase();
  }

  // Format date of birth properly
  getFormattedDOB(): string {
    if (!this.dob) return '';
    
    try {
      const date = new Date(this.dob);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return '';
      }
      
      // Format as MM/DD/YYYY or DD/MM/YYYY based on locale
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (error) {
      console.warn('Invalid date format for DOB:', this.dob);
      return '';
    }
  }

  // Get display gender (avoid showing "Other" if not meaningful)
  getDisplayGender(): string {
    if (!this.gender) return '';
    
    const normalizedGender = this.gender.toLowerCase().trim();
    
    // Only show meaningful gender values
    if (['male', 'm', 'female', 'f'].includes(normalizedGender)) {
      return this.gender.charAt(0).toUpperCase() + this.gender.slice(1).toLowerCase();
    }
    
    // Don't show "Other" or unclear values
    return '';
  }

  // Medical statistics methods
  getTotalVisits(): number {
    return this.patientData?.total_visits || 0;
  }

  getActiveMedications(): number {
    return this.patientData?.active_medications?.length || 0;
  }

  getActiveAlerts(): number {
    const allergies = this.patientData?.allergies?.length || 0;
    const alerts = this.patientData?.active_alerts?.length || 0;
    return allergies + alerts;
  }

  getLastVisit(): string {
    if (!this.patientData?.last_visit) return 'No visits';
    
    try {
      const date = new Date(this.patientData.last_visit);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (error) {
      return 'Unknown';
    }
  }

onNewPrescription() {
  if (this.patientData?.id) {
    this.router.navigate(['/doctor/prescription'], { queryParams: { patientId: this.patientData.id, from_patient_record: true } });
  }
}

onScheduleAppointment() {
  if (this.patientData?.id) {
    this.router.navigate(['/doctor/calendar'], { queryParams: { patientId: this.patientData.id, action: 'schedule' } });
  }
}
}