export enum AppointmentStatus {
  Pending = 'Pending',
  Confirmed = 'Confirmed',
  Completed = 'Completed',
  Cancelled = 'Cancelled',
  NoShow = 'NoShow'
}

export enum AppointmentType {
  Consultation = 'Consultation',
  Examination = 'Examination',
  FollowUp = 'FollowUp',
  Emergency = 'Emergency',
  Vaccination = 'Vaccination',
  BlockedTime = 'BlockedTime'
}

export interface Appointment {
  patientEmail?: string;
  patientPhone?: any;
  id: number;
  patientId: number;
  patientName: string;
  doctorId: number;
  doctorName: string;
  doctorSpecialty?: string;
  date: string;
  time: string;
  endTime?: string;
  duration: number; // in minutes
  type: AppointmentType | string;
  reason: string;
  status: AppointmentStatus;
  location?: string;
  notes?: string[];
  createdBy?: string; // user role who created it
  createdAt?: string;
  updatedAt?: string;
  cancelReason?: string;
  cancelledBy?: string;
  followUp?: boolean;
  isBlockedTime?: boolean;
  blockCategory?: string;
  recurrenceRule?: string;
}

export interface AppointmentFilter {
  startDate?: string;
  endDate?: string;
  patientId?: number;
  doctorId?: number;
  status?: AppointmentStatus[];
  type?: AppointmentType[];
}