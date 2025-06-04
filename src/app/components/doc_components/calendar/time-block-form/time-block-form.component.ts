import { Component, EventEmitter, HostListener, inject, Input, OnInit, OnChanges, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { CalendarService } from '../../../../services/doc-services/calendar/calendar.service';
import { CalendarEvent } from '../../../../models/calendar/calendar-event.model';
import { CalendarResource } from '../../../../models/calendar/calendar-resource.model';
import { DoctorAppointmentService } from '../../../../shared/services/doctor-appointment.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { Observable, of, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-time-block-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './time-block-form.component.html',
  styleUrls: ['./time-block-form.component.css']
})
export class TimeBlockFormComponent implements OnInit, OnChanges {
  @Input() show: boolean = false;
  @Input() blockToEdit: CalendarEvent | null = null;
  @Input() isAppointmentForm: boolean = false; // New input to differentiate between appointment and block time forms
  
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<CalendarEvent>();
  @Output() deleted = new EventEmitter<string>();
  private calendarService = inject(CalendarService);
  private fb = inject(FormBuilder);
  private doctorAppointmentService = inject(DoctorAppointmentService);
  private authService = inject(AuthService);
  
  blockForm!: FormGroup;
  errorMessage: string = '';
  resources = this.calendarService.resources;
  weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  // Patient search functionality
  patients: any[] = [];
  selectedPatient: any = null;
  patientSearchTerm = new Subject<string>();
  isLoadingPatients = false;
  showPatientsList = false; // Controls visibility of patient search results dropdown
  
  // Appointment types based on backend validation
  appointmentTypes = [
    { value: 'consultation', label: 'Consultation' },
    { value: 'follow-up', label: 'Follow-up' },
    { value: 'procedure', label: 'Procedure' },
    { value: 'emergency', label: 'Emergency' },
    { value: 'therapy', label: 'Therapy' }
  ];
  
  // Priority options
  priorityOptions = [
    { value: 'low', label: 'Low' },
    { value: 'normal', label: 'Normal' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' }
  ];
  
  // Reminder preferences
  reminderOptions = [
    { value: 'email', label: 'Email' },
    { value: 'sms', label: 'SMS' },
    { value: 'both', label: 'Both' },
    { value: 'none', label: 'None' }
  ];
  get isEditing(): boolean {
    const result = !!this.blockToEdit;
    
    return result;
  }
  
  get isCreating(): boolean {
    const result = !this.blockToEdit;
    
    return result;
  }
    get actionButtonText(): string {
    const result = this.isAppointmentForm
      ? (this.isEditing ? 'Update Appointment' : 'Create Appointment')
      : (this.isEditing ? 'Update Time Block' : 'Block Time');
    
    return result;
  }

  private getCurrentDoctorId(): string {
    const currentUser = this.authService.currentUserValue;
    if (currentUser && currentUser.id) {
      return currentUser.id.toString();
    }
    console.warn('Could not get current user ID, falling back to default doctor-1');
    return 'doctor-1'; // Fallback in case of issues
  }
    ngOnInit(): void {
    console.log('TimeBlockFormComponent initialized:', {
      isAppointmentForm: this.isAppointmentForm,
      isEditing: this.isEditing,
      isCreating: this.isCreating,
      blockToEdit: this.blockToEdit
    });
    
    this.initForm();
      // Setup patient search with debounce
    this.patientSearchTerm.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(term => {
        
        if (!term || term.length < 2) {
          return of([]);
        }
        this.isLoadingPatients = true;
        return this.doctorAppointmentService.getAvailablePatients(term);
      })
    ).subscribe({
      next: (results) => {
        
        this.patients = results;
        this.isLoadingPatients = false;
      },
      error: (err) => {
        console.error('Error searching for patients:', err);
        this.isLoadingPatients = false;
        this.patients = [];
      }
    });
  }
    ngOnChanges(): void {
    
    
    
    // Reinitialize form when inputs change
    if (this.blockForm) {
      this.initForm();
    }
  }
    private initForm(): void {
    
    
    // Reset patient selection when initializing form
    this.selectedPatient = null;
    this.patients = [];
    this.showPatientsList = false;
    this.errorMessage = '';
      // Base form controls for both block time and appointments
    const formControls = {
      title: ['', Validators.required],
      resourceId: ['', [Validators.required]], // Now properly required with current doctor's ID
      startDate: ['', Validators.required],
      startTime: ['', Validators.required],
      endDate: ['', Validators.required],
      endTime: ['', Validators.required],
      notes: ['']
    };
    
    // Add appointment-specific controls based on backend API requirements
    if (this.isAppointmentForm) {
      Object.assign(formControls, {
        patientName: ['', Validators.required], // For display purposes
        patient_user_id: ['', Validators.required], // Actual ID sent to backend
        appointmentType: ['consultation', Validators.required], // Display value (for backward compatibility)
        type: ['consultation', Validators.required], // Actual value sent to backend
        reason_for_visit: ['', [Validators.required, Validators.maxLength(500)]],
        priority: ['normal'],
        notes_by_staff: ['', Validators.maxLength(1000)],
        reminder_preference: ['email']
      });
    } 
    // Add block time-specific controls
    else {
      Object.assign(formControls, {
        blockCategory: ['other'],
        isRecurring: [false],
        day0: [false], // Monday
        day1: [false], // Tuesday
        day2: [false], // Wednesday
        day3: [false], // Thursday
        day4: [false], // Friday
        day5: [false], // Saturday
        day6: [false], // Sunday,
      });
    }
      this.blockForm = this.fb.group(formControls);
    
    // Initialize with default values if not editing
    if (!this.blockToEdit) {
      // Try to get default date/time from CalendarService first
      const defaultStart = this.calendarService.defaultStartDateTime();
      const defaultEnd = this.calendarService.defaultEndDateTime();
      
      let startDate: Date, endDate: Date, startTime: string, endTime: string;
      
      if (defaultStart && defaultEnd) {
        // Use the default date/time from CalendarService (from calendar clicks)
        startDate = defaultStart;
        endDate = defaultEnd;
        startTime = this.formatTime(defaultStart);
        endTime = this.formatTime(defaultEnd);
        
        console.log('Using CalendarService default date/time:', {
          startDate,
          endDate,
          startTime,
          endTime
        });
      } else {
        // Fallback to current time
        const today = new Date();
        startDate = today;
        endDate = today;
        startTime = '09:00';
        endTime = '10:00';
        
        console.log('Using fallback default date/time (CalendarService defaults not available)');
      }
        this.blockForm.patchValue({
        startDate: this.formatDate(startDate),
        endDate: this.formatDate(endDate),
        startTime: startTime,
        endTime: endTime,
        resourceId: this.getCurrentDoctorId() // Use actual current doctor's ID
      });
    } else {
      this.populateForm();
    }
      // Setup field synchronization if this is an appointment form
    if (this.isAppointmentForm) {
      this.syncAppointmentFields();
      this.syncAppointmentDates();
    }
  }
    private populateForm(): void {
    if (!this.blockToEdit) return;
    
    const start = new Date(this.blockToEdit.start);
    const end = new Date(this.blockToEdit.end);
    
    // Set basic fields for both types
    const baseValues: Record<string, any> = {
      title: this.blockToEdit.title,
      resourceId: this.blockToEdit.resourceId || '',
      startDate: this.formatDate(start),
      startTime: this.formatTime(start),
      endDate: this.formatDate(end),
      endTime: this.formatTime(end),
      notes: this.blockToEdit.extendedProps?.['notes'] || ''
    };
    
    // Additional fields based on form type
    if (this.isAppointmentForm) {
      // Extract patient data from extendedProps or originalAppointment
      const extendedProps = this.blockToEdit.extendedProps || {};
      const originalAppointment = extendedProps['originalAppointment'] || {};
      
      // Check for patient details in various possible locations
      const patientName = 
        extendedProps['patientName'] || 
        originalAppointment['patientName'] ||
        '';
        
      const patientId = 
        extendedProps['patient_user_id'] || 
        originalAppointment['patient_user_id'] ||
        '';
      
      // Check for appointment type in various possible locations
      const appointmentType = 
        extendedProps['type'] || 
        extendedProps['appointmentType'] || 
        originalAppointment['type'] ||
        'consultation';
      
      // Get reason for visit
      const reasonForVisit = 
        extendedProps['reason_for_visit'] || 
        originalAppointment['reason_for_visit'] ||
        '';
      
      // Get priority, notes and reminder preference
      const priority = 
        extendedProps['priority'] || 
        originalAppointment['priority'] ||
        'normal';
        
      const notesByStaff = 
        extendedProps['notes_by_staff'] || 
        extendedProps['notes'] ||
        originalAppointment['notes_by_staff'] ||
        '';
        
      const reminderPreference = 
        extendedProps['reminder_preference'] || 
        originalAppointment['reminder_preference'] ||
        'email';
      
      
        
      Object.assign(baseValues, {
        patientName: patientName,
        patient_user_id: patientId,
        appointmentType: appointmentType,
        type: appointmentType,
        reason_for_visit: reasonForVisit,
        priority: priority,
        notes_by_staff: notesByStaff,
        reminder_preference: reminderPreference
      });
        // If we have a patient ID, set the selectedPatient object with all available info
      if (patientId) {
        // Get additional patient info if available
        const patientEmail = extendedProps['patientEmail'] || originalAppointment['patientEmail'] || '';
        const patientPhone = extendedProps['patientPhone'] || originalAppointment['patientPhone'] || '';
        
        this.selectedPatient = {
          id: patientId,
          name: patientName,
          email: patientEmail,
          phone: patientPhone
        };
        
        
      }
    } else {
      Object.assign(baseValues, {
        blockCategory: this.blockToEdit.extendedProps?.['blockCategory'] || 'other'
      });
      
      // Handle recurring events for block time
      const recurrenceRule = this.blockToEdit.extendedProps?.['recurrenceRule'];
      if (recurrenceRule) {
        baseValues['isRecurring'] = true;
        
        // Parse recurrence rule to set weekdays
        if (recurrenceRule.includes('BYDAY=')) {
          const daysStr = recurrenceRule.split('BYDAY=')[1].split(';')[0];
          const days = daysStr.split(',');
          
          const dayMap: Record<string, number> = {
            'MO': 0, 'TU': 1, 'WE': 2, 'TH': 3, 'FR': 4, 'SA': 5, 'SU': 6
          };
          
          for (const day of days) {
            const dayIndex = dayMap[day];
            if (dayIndex !== undefined) {
              baseValues[`day${dayIndex}`] = true;
            }
          }
        }
      }
    }
    
    this.blockForm.patchValue(baseValues);
  }  saveBlock(): void {
    
    
    
    
    
    
    
    
    
    
    
    
    // Debug individual field validation
    
    Object.keys(this.blockForm.controls).forEach(key => {
      const control = this.blockForm.get(key);
      console.log(`${key}:`, {
        value: control?.value,
        valid: control?.valid,
        invalid: control?.invalid,
        errors: control?.errors,
        touched: control?.touched
      });
    });
      if (this.blockForm.invalid) {
      
      this.blockForm.markAllAsTouched();
      
      // Create a detailed error message
      const errors: string[] = [];
      Object.keys(this.blockForm.controls).forEach(key => {
        const control = this.blockForm.get(key);
        if (control?.invalid && control.hasError('required')) {
          errors.push(key);
        }
      });
      
      this.errorMessage = `Please fill all required fields: ${errors.join(', ')}`;
      return;
    }
    
    const formValues = this.blockForm.value;
    
      // Validate dates
    const startDateTime = this.combineDateAndTime(formValues.startDate, formValues.startTime);
    const endDateTime = this.combineDateAndTime(formValues.endDate, formValues.endTime);
    
    // For appointments, ensure they're on the same day
    if (this.isAppointmentForm) {
      const startDate = new Date(formValues.startDate);
      const endDate = new Date(formValues.endDate);
      
      if (startDate.toDateString() !== endDate.toDateString()) {
        this.errorMessage = 'Appointments cannot span multiple days. Please select the same date for start and end.';
        return;
      }
    }
    
    if (endDateTime <= startDateTime) {
      this.errorMessage = 'End time must be after start time';
      return;
    }
    
    // Determine if this is a create or update operation
    const isCreating = !this.blockToEdit;
    
    
    // Handle different operations based on form type and create/update mode
    if (this.isAppointmentForm) {
      if (isCreating) {
        
        this.createNewAppointment(formValues, startDateTime, endDateTime);
      } else {
        
        this.updateExistingAppointment(formValues, startDateTime, endDateTime);
      }
    } else {
      if (isCreating) {
        
        this.createNewTimeBlock(formValues, startDateTime, endDateTime);
      } else {
        
        this.updateExistingTimeBlock(formValues, startDateTime, endDateTime);
      }
    }
  }  private createNewAppointment(formValues: any, startDateTime: Date, endDateTime: Date): void {
    console.log('=== APPOINTMENT CREATION PROCESS START ===');
    
    // First, let's test if we can reach the backend with a simple GET request
    console.log('🔍 Testing backend connectivity...');
    this.doctorAppointmentService.getMyAppointments().subscribe({
      next: (appointments) => {
        console.log('✅ Backend connectivity test PASSED - got appointments:', appointments.length);
        this.proceedWithAppointmentCreation(formValues, startDateTime, endDateTime);
      },
      error: (error) => {
        console.log('❌ Backend connectivity test FAILED:', error);
        console.log('This suggests an authentication or network issue before we even try to create the appointment');
        
        let errorMessage = 'Cannot connect to backend. Please check your connection and try logging in again.';
        if (error.status === 401) {
          errorMessage = 'Authentication expired. Please log in again.';
        } else if (error.status === 0) {
          errorMessage = 'Cannot reach the server. Please check your internet connection.';
        }
        
        this.errorMessage = errorMessage;
      }
    });  }

  private proceedWithAppointmentCreation(formValues: any, startDateTime: Date, endDateTime: Date): void {
    console.log('🚀 Proceeding with appointment creation...');
    
    // Prepare API payload for new appointment
    const apiPayload = {
      patient_user_id: formValues.patient_user_id,
      appointment_datetime_start: this.formatDateTimeForBackend(startDateTime),
      appointment_datetime_end: this.formatDateTimeForBackend(endDateTime),
      type: formValues.type,
      reason_for_visit: formValues.reason_for_visit,
      priority: formValues.priority || 'normal',
      notes_by_staff: formValues.notes_by_staff || '',
      reminder_preference: formValues.reminder_preference || 'email'
    };
    
    
    
    console.log('Payload being sent:', JSON.stringify(apiPayload, null, 2));
    
    // Call the backend to create the appointment
    this.doctorAppointmentService.createAppointment(apiPayload).subscribe({
      next: (createdAppointment) => {
        
        
        // Create calendar event object for the frontend
        const appointment: CalendarEvent = {
          id: `appointment-${createdAppointment.id || Date.now()}`,
          title: formValues.title,
          start: startDateTime.toISOString(),
          end: endDateTime.toISOString(),
          resourceId: formValues.resourceId,
          color: '#4285F4', // Blue for appointments
          textColor: '#FFFFFF',
          extendedProps: {
            isAppointment: true,
            patientName: formValues.patientName,
            patient_user_id: formValues.patient_user_id,
            type: formValues.type,
            reason_for_visit: formValues.reason_for_visit,
            priority: formValues.priority,
            notes_by_staff: formValues.notes_by_staff,
            reminder_preference: formValues.reminder_preference,
            status: 'scheduled',
            originalAppointment: createdAppointment          }
        };
        
        this.saved.emit(appointment);
        this.closeForm();
      },      error: (error) => {
        console.error('Error creating appointment:', error);
        console.error('Error status:', error.status);
        console.error('Error message:', error.message);
        console.error('Error response body:', error.error);
        
        // Display more specific error message
        let errorMessage = 'Failed to create appointment. Please try again.';
        if (error.error && error.error.message) {
          errorMessage = error.error.message;
        } else if (error.error && error.error.error) {
          errorMessage = error.error.error;
        }
        
        this.errorMessage = errorMessage;
      }
    });
  }

  private updateExistingAppointment(formValues: any, startDateTime: Date, endDateTime: Date): void {
    
    
    if (!this.blockToEdit) return;
    
    // Get the appointment ID from the existing appointment
    const appointmentId = this.blockToEdit.extendedProps?.['originalAppointment']?.id || 
                          this.blockToEdit.extendedProps?.['appointmentId'] ||
                          this.blockToEdit.id;    // Prepare API payload for update
    const apiPayload = {
      patient_user_id: formValues.patient_user_id,
      appointment_datetime_start: this.formatDateTimeForBackend(startDateTime),
      appointment_datetime_end: this.formatDateTimeForBackend(endDateTime),
      type: formValues.type,
      reason_for_visit: formValues.reason_for_visit,
      priority: formValues.priority || 'normal',
      notes_by_staff: formValues.notes_by_staff || '',
      reminder_preference: formValues.reminder_preference || 'email'
    };
    
    
    
    // Call the backend to update the appointment
    this.doctorAppointmentService.updateAppointment(appointmentId, apiPayload).subscribe({
      next: (updatedAppointment) => {
        
        
        // Create updated calendar event object
        const appointment: CalendarEvent = {
          ...this.blockToEdit!,
          title: formValues.title,
          start: startDateTime.toISOString(),
          end: endDateTime.toISOString(),
          extendedProps: {
            ...this.blockToEdit!.extendedProps,
            patientName: formValues.patientName,
            patient_user_id: formValues.patient_user_id,
            type: formValues.type,
            reason_for_visit: formValues.reason_for_visit,
            priority: formValues.priority,
            notes_by_staff: formValues.notes_by_staff,
            reminder_preference: formValues.reminder_preference,
            originalAppointment: updatedAppointment          }
        };
        
        this.saved.emit(appointment);
        this.closeForm();
      },
      error: (error) => {
        console.error('Error updating appointment:', error);
        this.errorMessage = 'Failed to update appointment. Please try again.';
      }
    });
  }
  private createNewTimeBlock(formValues: any, startDateTime: Date, endDateTime: Date): void {
    
    
    // Call the backend to block the time slot
    this.doctorAppointmentService.blockTimeSlot(
      this.formatDateTimeForBackend(startDateTime),
      this.formatDateTimeForBackend(endDateTime),
      formValues.title
    ).subscribe({
      next: (response) => {
        console.log('Time block created successfully:', response);
        
        // Create calendar event object for the frontend
        const blockedTime: CalendarEvent = {
          id: `block-${response.data?.id || Date.now()}`,
          title: formValues.title,
          start: startDateTime.toISOString(),
          end: endDateTime.toISOString(),
          resourceId: formValues.resourceId,
          color: this.getBlockColor(formValues.blockCategory),
          textColor: '#FFFFFF',
          extendedProps: {
            isBlockedTime: true,
            blockCategory: formValues.blockCategory,
            notes: formValues.notes,
            originalBlock: response.data
          }
        };
          this.saved.emit(blockedTime);
        this.closeForm();
      },
      error: (error) => {
        console.error('Error creating time block:', error);
        this.errorMessage = 'Failed to block time slot. Please try again.';
      }
    });
  }
  private updateExistingTimeBlock(formValues: any, startDateTime: Date, endDateTime: Date): void {
    
    
    if (!this.blockToEdit) return;
    
    // Get the time block ID from the existing block
    const timeBlockId = this.blockToEdit.extendedProps?.['originalBlock']?.id || 
                        this.blockToEdit.extendedProps?.['timeBlockId'] ||
                        this.blockToEdit.id;
    
    
      // Call the backend to update the time block
    this.doctorAppointmentService.updateBlockedTimeSlot(
      timeBlockId,
      this.formatDateTimeForBackend(startDateTime),
      this.formatDateTimeForBackend(endDateTime),
      formValues.title
    ).subscribe({
      next: (response) => {
        console.log('Time block updated successfully:', response);
        
        // Create updated time block event object for frontend
        const blockedTime: CalendarEvent = {
          ...this.blockToEdit!,
          title: formValues.title,
          start: startDateTime.toISOString(),
          end: endDateTime.toISOString(),
          color: this.getBlockColor(formValues.blockCategory),
          extendedProps: {
            ...this.blockToEdit!.extendedProps,
            blockCategory: formValues.blockCategory,
            notes: formValues.notes,
            originalBlock: response.data || response
          }
        };
        
        console.log('Updated time block:', blockedTime);
        
        this.saved.emit(blockedTime);
        this.closeForm();
      },
      error: (error) => {
        console.error('Error updating time block:', error);
        this.errorMessage = 'Failed to update time block. Please try again.';
      }
    });
  }

  private getBlockColor(category: string): string {
    switch (category) {
      case 'meeting': return '#8E24AA'; // Purple
      case 'vacation': return '#F4B400'; // Yellow
      case 'lunch': return '#E67C73'; // Red
      default: return '#E67C73'; // Default red for blocked time
    }
  }
    deleteBlock(): void {
    if (this.blockToEdit) {
      this.deleted.emit(this.blockToEdit.id);
      this.closeForm();
    }
  }
    cancel(): void {
    this.closeForm();
  }
  
  private closeForm(): void {
    // Clean up default date/time in CalendarService
    this.calendarService.clearDefaultDateTime();
    
    // Reset form state
    this.selectedPatient = null;
    this.patients = [];
    this.showPatientsList = false;
    this.errorMessage = '';
    
    
    
    // Emit close event
    this.close.emit();
  }// Search for patients based on the input term
  onPatientSearch(term: string): void {
    console.log('Patient search term:', term);
    if (term && term.length >= 2) {
      this.showPatientsList = true;
      this.isLoadingPatients = true;
      this.patientSearchTerm.next(term);
    } else {
      this.patients = [];
      this.showPatientsList = false;
      this.isLoadingPatients = false;
    }
  }
  
  // Select a patient from search results
  selectPatient(patient: any): void {
    this.selectedPatient = patient;
    this.blockForm.patchValue({
      patientName: patient.name,
      patient_user_id: patient.id
    });
    this.patients = []; // Clear search results
    this.showPatientsList = false;

    // Focus next field after selection
    const nextField = document.getElementById('reason_for_visit');
    if (nextField) {
      setTimeout(() => nextField.focus(), 100);
    }
  }
  
  // Clear the selected patient
  clearSelectedPatient(): void {
    this.selectedPatient = null;
    this.blockForm.patchValue({
      patientName: '',
      patient_user_id: ''
    });
    
    // Focus on the search field
    const searchField = document.getElementById('patientName');
    if (searchField) {
      setTimeout(() => {
        searchField.focus();
        this.showSearchOnFocus();
      }, 100);
    }
  }
  
  // Check appointment conflicts with the doctor's schedule
  checkConflicts(): void {
    if (this.blockForm.invalid) {
      return;
    }
    
    const formValues = this.blockForm.value;
    const startDateTime = this.combineDateAndTime(formValues.startDate, formValues.startTime);
    const endDateTime = this.combineDateAndTime(formValues.endDate, formValues.endTime);
      const payload = {
      doctor_user_id: formValues.resourceId,
      start_datetime: this.formatDateTimeForBackend(startDateTime),
      end_datetime: this.formatDateTimeForBackend(endDateTime)
    };
    
    this.doctorAppointmentService.checkConflicts(payload).subscribe({
      next: (response) => {
        if (response.hasConflicts) {
          this.errorMessage = 'There is a scheduling conflict with another appointment';
        } else {
          this.errorMessage = '';
        }
      },
      error: (err) => {
        console.error('Error checking conflicts:', err);
      }
    });
  }
  
  // Helper methods
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
  
  private formatTime(date: Date): string {
    return date.toTimeString().substring(0, 5);
  }
  
  private combineDateAndTime(dateStr: string, timeStr: string): Date {
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hours, minutes] = timeStr.split(':').map(Number);
    
    return new Date(year, month - 1, day, hours, minutes);
  }
  
  // Helper method to sync appointment type changes between the two fields for compatibility
  syncAppointmentFields(): void {
    this.blockForm.get('type')?.valueChanges.subscribe(value => {
      this.blockForm.get('appointmentType')?.setValue(value, { emitEvent: false });
    });
    
    // Also sync date/time changes to check for conflicts
    this.blockForm.get('startDate')?.valueChanges.subscribe(() => this.checkConflicts());
    this.blockForm.get('startTime')?.valueChanges.subscribe(() => this.checkConflicts());
    this.blockForm.get('endDate')?.valueChanges.subscribe(() => this.checkConflicts());
    this.blockForm.get('endTime')?.valueChanges.subscribe(() => this.checkConflicts());
  }
  // Synchronize start and end dates for appointments (they should be the same day)
  private syncAppointmentDates(): void {
    // When start date changes, update end date to match
    this.blockForm.get('startDate')?.valueChanges.subscribe(startDate => {
      if (startDate && this.isAppointmentForm) {
        this.blockForm.patchValue({ endDate: startDate }, { emitEvent: false });
        console.log('Synced end date to match start date:', startDate);
      }
    });
    
    // When end date changes, update start date to match (for appointments, they should be same day)
    this.blockForm.get('endDate')?.valueChanges.subscribe(endDate => {
      if (endDate && this.isAppointmentForm) {
        const currentStartDate = this.blockForm.get('startDate')?.value;
        if (currentStartDate !== endDate) {
          this.blockForm.patchValue({ startDate: endDate }, { emitEvent: false });
          console.log('Synced start date to match end date:', endDate);
        }
      }
    });
  }
  // Show or hide the patients list based on focus event
  showSearchOnFocus(): void {
    // If we have a stored search term, re-search to show existing results
    const currentValue = this.blockForm.get('patientName')?.value;
    if (currentValue && currentValue.length >= 2) {
      this.showPatientsList = true;
      this.isLoadingPatients = true;
      this.onPatientSearch(currentValue);
    } else {
      this.showPatientsList = true;
    }
  }

  // Hide patient search results
  hideSearchResults(): void {
    setTimeout(() => {
      this.showPatientsList = false;
    }, 200); // Small delay to allow clicks to register first
  }
  // Handle document clicks to hide search results when clicking outside
  @HostListener('document:click', ['$event'])
  handleDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const searchContainer = document.querySelector('.patient-search-container');
    
    if (searchContainer && !searchContainer.contains(target)) {
      this.hideSearchResults();
    }
  }
  /**
   * Format Date object to backend expected format: "YYYY-MM-DD HH:mm:ss"
   * Uses UTC time to match backend timezone expectations
   * @param date Date object to format
   * @returns Formatted date string in UTC
   */
  private formatDateTimeForBackend(date: Date): string {
    // Use UTC methods to ensure timezone consistency with backend
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const seconds = String(date.getUTCSeconds()).padStart(2, '0');
    
    const formatted = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    console.log('Formatted date for backend (UTC):', { 
      input: date.toISOString(), 
      localTime: date.toString(),
      utcOutput: formatted 
    });
    return formatted;
  }
}