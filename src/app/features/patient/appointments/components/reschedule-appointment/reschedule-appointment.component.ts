import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { PatientAppointmentService } from '../../../../../shared/services/patient-appointment.service';

@Component({
  selector: 'app-reschedule-appointment',
  standalone: false,
  templateUrl: './reschedule-appointment.component.html',
  styleUrl: './reschedule-appointment.component.css'
})
export class RescheduleAppointmentComponent implements OnInit {
  rescheduleForm: FormGroup;
  isLoading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private patientAppointmentService: PatientAppointmentService,
    public dialogRef: MatDialogRef<RescheduleAppointmentComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { appointment: any }
  ) {
    this.rescheduleForm = this.fb.group({
      date: ['', [Validators.required]],
      time: ['', [Validators.required]],
      duration: [30, [Validators.required, Validators.min(15), Validators.max(120)]],
      reason: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    // Set default values if available
    if (this.data.appointment) {
      const currentDate = this.data.appointment.date;
      const currentTime = this.convertTo24Hour(this.data.appointment.time);
      
      this.rescheduleForm.patchValue({
        date: currentDate,
        time: currentTime,
        duration: this.data.appointment.duration || 30,
        reason: 'Patient requested reschedule'
      });
    }
  }

  onSubmit(): void {
    if (this.rescheduleForm.valid) {
      this.isLoading = true;
      this.errorMessage = null;
      this.successMessage = null;

      const formValue = this.rescheduleForm.value;
      
      // Combine date and time for start datetime
      const startDateTime = new Date(`${formValue.date}T${formValue.time}:00`);
      const endDateTime = new Date(startDateTime.getTime() + formValue.duration * 60 * 1000);

      const rescheduleData = {
        appointment_datetime_start: this.formatDateTimeForApi(startDateTime),
        appointment_datetime_end: this.formatDateTimeForApi(endDateTime),
        reason: formValue.reason
      };

      console.log('Rescheduling appointment with data:', rescheduleData);

      this.patientAppointmentService.rescheduleMyAppointment(this.data.appointment.id, rescheduleData)
        .subscribe({
          next: (updatedAppointment) => {
            console.log('Appointment rescheduled successfully:', updatedAppointment);
            this.successMessage = 'Appointment rescheduled successfully!';
            this.isLoading = false;
            
            // Close dialog after a short delay to show success message
            setTimeout(() => {
              this.dialogRef.close(updatedAppointment);
            }, 1500);
          },
          error: (error) => {
            console.error('Error rescheduling appointment:', error);
            this.isLoading = false;
            
            if (error.error && error.error.error) {
              this.errorMessage = error.error.error;
            } else if (error.error && error.error.message) {
              this.errorMessage = error.error.message;
            } else {
              this.errorMessage = 'Failed to reschedule appointment. Please try again.';
            }
          }
        });
    } else {
      this.markFormGroupTouched();
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  // Helper methods
  private convertTo24Hour(time12h: string): string {
    if (!time12h) return '';
    
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':');
    
    if (hours === '12') {
      hours = '00';
    }
    
    if (modifier === 'PM') {
      hours = parseInt(hours, 10) + 12 + '';
    }
    
    return `${hours.padStart(2, '0')}:${minutes}`;
  }

  private formatDateTimeForApi(date: Date): string {
    // Format as "YYYY-MM-DD HH:mm:ss" for API
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  private markFormGroupTouched(): void {
    Object.keys(this.rescheduleForm.controls).forEach(key => {
      const control = this.rescheduleForm.get(key);
      control?.markAsTouched();
    });
  }

  // Form validation helpers
  isFieldInvalid(fieldName: string): boolean {
    const field = this.rescheduleForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.rescheduleForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
      }
      if (field.errors['min']) {
        return `Minimum value is ${field.errors['min'].min}`;
      }
      if (field.errors['max']) {
        return `Maximum value is ${field.errors['max'].max}`;
      }
    }
    return '';
  }
  // Getter for appointment info
  get appointmentInfo() {
    return this.data.appointment;
  }

  // Get tomorrow's date for minimum date validation
  getTomorrowDate(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }
}
