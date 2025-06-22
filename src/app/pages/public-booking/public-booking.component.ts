import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CalendarComponent } from '../../components/landing/calendar/calendar.component';

interface BookingForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  preferredDate: string;
  preferredTime: string;
  department: string;
  message: string;
}

@Component({
  selector: 'app-public-booking',
  standalone: true,
  imports: [CommonModule, FormsModule , CalendarComponent ],
  templateUrl: './public-booking.component.html',
  styleUrls: ['./public-booking.component.css']
})
export class PublicBookingComponent implements OnInit {
  bookingData: BookingForm = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    preferredDate: '',
    preferredTime: '',
    department: '',
    message: ''
  };

  departments = [
    { value: 'general', label: 'General Medicine' },
    { value: 'cardiology', label: 'Cardiology' },
    { value: 'dermatology', label: 'Dermatology' },
    { value: 'orthopedics', label: 'Orthopedics' },
    { value: 'pediatrics', label: 'Pediatrics' },
    { value: 'gynecology', label: 'Gynecology' },
    { value: 'neurology', label: 'Neurology' },
    { value: 'psychiatry', label: 'Psychiatry' }
  ];

  timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'
  ];
  isSubmitting = false;
  showSuccessMessage = false;
  minDate: Date = new Date();
  selectedDate: Date | null = null;

  constructor(private router: Router) { }

  ngOnInit(): void {
    // Set minimum date to today
    this.minDate = new Date();
    // Set today's date by default
    this.selectedDate = new Date();
    this.bookingData.preferredDate = this.selectedDate.toISOString().split('T')[0];
  }

  onDateSelected(date: Date): void {
    this.selectedDate = date;
    // Update the booking data with the selected date
    this.bookingData.preferredDate = date.toISOString().split('T')[0];
  }

  selectTimeSlot(time: string): void {
    this.bookingData.preferredTime = time;
  }

  onSubmit(): void {
    if (this.isFormValid()) {
      this.isSubmitting = true;
      
      // Simulate API call
      setTimeout(() => {
        this.isSubmitting = false;
        this.showSuccessMessage = true;
        
        // Reset form
        this.bookingData = {
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          preferredDate: '',
          preferredTime: '',
          department: '',
          message: ''
        };
        
        // Hide success message after 5 seconds
        setTimeout(() => {
          this.showSuccessMessage = false;
        }, 5000);
      }, 2000);
    }
  }

  isFormValid(): boolean {
    return !!(
      this.bookingData.firstName &&
      this.bookingData.lastName &&
      this.bookingData.email &&
      this.bookingData.phone &&
      this.bookingData.preferredDate &&
      this.bookingData.preferredTime &&
      this.bookingData.department
    );
  }

  goBackToHome(): void {
    this.router.navigate(['/']);
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
