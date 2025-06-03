import { Component, EventEmitter, HostListener, inject, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { CalendarService } from '../../../../services/doc-services/calendar/calendar.service';
import { CalendarEvent } from '../../../../models/calendar/calendar-event.model';
import { CalendarResource } from '../../../../models/calendar/calendar-resource.model';
import { DoctorAppointmentService } from '../../../../shared/services/doctor-appointment.service';
import { Observable, of, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-time-block-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './time-block-form.component.html',
  styleUrls: ['./time-block-form.component.css']
})
export class TimeBlockFormComponent implements OnInit {
  @Input() show: boolean = false;
  @Input() blockToEdit: CalendarEvent | null = null;
  @Input() isAppointmentForm: boolean = false; // New input to differentiate between appointment and block time forms
  
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<CalendarEvent>();
  @Output() deleted = new EventEmitter<string>();
    private calendarService = inject(CalendarService);
  private fb = inject(FormBuilder);
  private doctorAppointmentService = inject(DoctorAppointmentService);
  
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
    return !!this.blockToEdit;
  }
    ngOnInit(): void {
    this.initForm();
      // Setup patient search with debounce
    this.patientSearchTerm.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(term => {
        console.log('Searching for patients with term:', term);
        if (!term || term.length < 2) {
          return of([]);
        }
        this.isLoadingPatients = true;
        return this.doctorAppointmentService.getAvailablePatients(term);
      })
    ).subscribe({
      next: (results) => {
        console.log('Patient search results:', results);
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
    if (this.blockForm && this.blockToEdit) {
      this.populateForm();
    }
  }
  
  private initForm(): void {
    // Base form controls for both block time and appointments
    const formControls = {
      title: ['', Validators.required],
      resourceId: ['', Validators.required],
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
      const today = new Date();
      this.blockForm.patchValue({
        startDate: this.formatDate(today),
        endDate: this.formatDate(today),
        startTime: '09:00',
        endTime: '10:00',
        resourceId: this.resources()[0]?.id || ''
      });
    } else {
      this.populateForm();
    }
    
    // Setup field synchronization if this is an appointment form
    if (this.isAppointmentForm) {
      this.syncAppointmentFields();
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
      
      console.log('Populating appointment form with patient:', patientName, 'type:', appointmentType);
        
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
        
        console.log('Found patient information for editing:', this.selectedPatient);
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
  }
  
  saveBlock(): void {
    if (this.blockForm.invalid) {
      this.errorMessage = 'Please fill all required fields';
      return;
    }
    
    const formValues = this.blockForm.value;
    
    // Validate dates
    const startDateTime = this.combineDateAndTime(formValues.startDate, formValues.startTime);
    const endDateTime = this.combineDateAndTime(formValues.endDate, formValues.endTime);
    
    if (endDateTime <= startDateTime) {
      this.errorMessage = 'End time must be after start time';
      return;
    }
    
    // Create the event object based on form type
    if (this.isAppointmentForm) {
      this.saveAppointment(formValues, startDateTime, endDateTime);
    } else {
      this.saveTimeBlock(formValues, startDateTime, endDateTime);
    }
  }
  private saveAppointment(formValues: any, startDateTime: Date, endDateTime: Date): void {
    // Create appointment event - preserve any existing extended properties
    const baseExtendedProps = this.blockToEdit?.extendedProps || {};
    const originalAppointment = baseExtendedProps['originalAppointment'] || {};
    
    // Ensure we have all fields required by the backend API
    const appointment: CalendarEvent = {
      id: this.blockToEdit?.id || `appointment-${Date.now()}`,
      title: formValues.title,
      start: startDateTime.toISOString(),
      end: endDateTime.toISOString(),
      resourceId: formValues.resourceId,
      color: '#4285F4', // Google Calendar blue for appointments
      textColor: '#FFFFFF',
      extendedProps: {
        ...baseExtendedProps,
        isAppointment: true,
        // Patient information
        patientName: formValues.patientName,
        patient_user_id: formValues.patient_user_id,
        // Appointment details
        type: formValues.type,
        appointmentType: formValues.appointmentType, // For backward compatibility
        reason_for_visit: formValues.reason_for_visit,
        priority: formValues.priority || 'normal',
        // Notes and preferences
        notes_by_staff: formValues.notes_by_staff || formValues.notes,
        notes: formValues.notes_by_staff || formValues.notes, // For backward compatibility
        reminder_preference: formValues.reminder_preference || 'email',
        // Status management
        status: baseExtendedProps['status'] || 'scheduled',
        // Doctor information
        doctorName: baseExtendedProps['doctorName'],
        doctorId: baseExtendedProps['doctorId'],
        // Preserve original appointment data if it exists
        originalAppointment: {
          ...originalAppointment,
          patient_user_id: formValues.patient_user_id,
          appointment_datetime_start: startDateTime.toISOString(),
          appointment_datetime_end: endDateTime.toISOString(),
          type: formValues.type,
          reason_for_visit: formValues.reason_for_visit,
          priority: formValues.priority,
          notes_by_staff: formValues.notes_by_staff || formValues.notes,
          reminder_preference: formValues.reminder_preference || 'email'
        }
      }
    };
    
    console.log('Saving appointment with data:', appointment);
    
    // Send to backend API if we have a proper patient ID
    if (formValues.patient_user_id) {
      const apiPayload = {
        patient_user_id: formValues.patient_user_id,
        appointment_datetime_start: startDateTime.toISOString(),
        appointment_datetime_end: endDateTime.toISOString(),
        type: formValues.type,
        reason_for_visit: formValues.reason_for_visit,
        priority: formValues.priority,
        notes_by_staff: formValues.notes_by_staff || formValues.notes,
        reminder_preference: formValues.reminder_preference
      };
      
      console.log('API payload:', apiPayload);
      
      // Skip API call in this implementation as it should be handled by the calendar container
      // We just propagate the event with all necessary data
    }
    
    // Save the appointment (will be caught by the parent component)
    this.saved.emit(appointment);
    this.close.emit();
  }
  
  private saveTimeBlock(formValues: any, startDateTime: Date, endDateTime: Date): void {
    // Create recurrence rule if needed
    let recurrenceRule = '';
    if (formValues.isRecurring) {
      const selectedDays = [];
      const dayMap = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];
      
      for (let i = 0; i < 7; i++) {
        if (formValues[`day${i}`]) {
          selectedDays.push(dayMap[i]);
        }
      }
      
      if (selectedDays.length > 0) {
        recurrenceRule = `FREQ=DAILY;BYDAY=${selectedDays.join(',')}`;
      }
    }
    
    // Set color based on category
    let color = '#E67C73'; // Default red for blocked time
    if (formValues.blockCategory === 'meeting') {
      color = '#8E24AA'; // Purple
    } else if (formValues.blockCategory === 'vacation') {
      color = '#F4B400'; // Yellow
    } else if (formValues.blockCategory === 'lunch') {
      color = '#E67C73'; // Red
    }
    
    // Create blocked time event
    const blockedTime: CalendarEvent = {
      id: this.blockToEdit?.id || `block-${Date.now()}`,
      title: formValues.title,
      start: startDateTime.toISOString(),
      end: endDateTime.toISOString(),
      resourceId: formValues.resourceId,
      color: color,
      textColor: '#FFFFFF',
      extendedProps: {
        isBlockedTime: true,
        blockCategory: formValues.blockCategory,
        notes: formValues.notes,
        recurrenceRule: recurrenceRule || undefined
      }
    };
    
    // Save the time block
    this.saved.emit(blockedTime);
    this.close.emit();
  }
  
  deleteBlock(): void {
    if (this.blockToEdit) {
      this.deleted.emit(this.blockToEdit.id);
      this.close.emit();
    }
  }
  
  cancel(): void {
    this.close.emit();
  }  // Search for patients based on the input term
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
      appointment_datetime_start: startDateTime.toISOString(),
      appointment_datetime_end: endDateTime.toISOString()
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
}