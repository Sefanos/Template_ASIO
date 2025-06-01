import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { CalendarService } from '../../../../services/doc-services/calendar/calendar.service';
import { CalendarEvent , CalendarResource } from '../../../../models/calendar/calendar.model';


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
  
  blockForm!: FormGroup;
  errorMessage: string = '';
  resources = this.calendarService.resources;
  weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  get isEditing(): boolean {
    return !!this.blockToEdit;
  }
  
  ngOnInit(): void {
    this.initForm();
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
    
    // Add appointment-specific controls
    if (this.isAppointmentForm) {
      Object.assign(formControls, {
        patientName: [''],
        appointmentType: ['checkup']
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
      notes: this.blockToEdit.extendedProps?.notes || ''
    };
    
    // Additional fields based on form type
    if (this.isAppointmentForm) {
      Object.assign(baseValues, {
        patientName: this.blockToEdit.extendedProps?.patientName || '',
        appointmentType: this.blockToEdit.extendedProps?.appointmentType || 'checkup'
      });
    } else {
      Object.assign(baseValues, {
        blockCategory: this.blockToEdit.extendedProps?.blockCategory || 'other'
      });
      
      // Handle recurring events for block time
      const recurrenceRule = this.blockToEdit.extendedProps?.recurrenceRule;
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
    // Create appointment event
    const appointment: CalendarEvent = {
      id: this.blockToEdit?.id || `appointment-${Date.now()}`,
      title: formValues.title,
      start: startDateTime.toISOString(),
      end: endDateTime.toISOString(),
      resourceId: formValues.resourceId,
      color: '#4285F4', // Google Calendar blue
      textColor: '#FFFFFF',
      extendedProps: {
        isAppointment: true,
        patientName: formValues.patientName || '',
        appointmentType: formValues.appointmentType,
        status: 'scheduled',
        notes: formValues.notes
      }
    };
    
    // Save the appointment
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
}