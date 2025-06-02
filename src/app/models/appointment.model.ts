export interface Appointment {
  // Frontend-friendly fields
  id: number;
  date: string;           // YYYY-MM-DD format
  time: string;           // HH:MM AM/PM format
  type: string;
  provider: string;       // Doctor name extracted from nested object
  reason: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
  
  // Additional fields from backend (optional for compatibility)
  patientId?: number;
  doctorId?: number;
  patientName?: string;
  doctorName?: string;
  doctorSpecialty?: string;
  startDateTime?: Date;
  endDateTime?: Date;
  duration?: number;      // in minutes
}

// Backend API response interface
export interface ApiAppointmentResponse {
  id: number;
  patient_user_id: number;
  doctor_user_id: number;
  appointment_datetime_start: string;
  appointment_datetime_end: string;
  type: string;
  reason_for_visit: string;
  status: string;
  cancellation_reason?: string;
  notes_by_patient?: string;
  notes_by_staff?: string;
  booked_by_user_id: number;
  last_updated_by_user_id: number;
  reminder_sent: boolean;
  reminder_sent_at?: string;
  verification_code?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  patient: {
    id: number;
    name: string;
    email: string;
    phone: string;
    status: string;
  };
  doctor: {
    id: number;
    name: string;
    email: string;
    phone: string;
    status: string;
  };
}