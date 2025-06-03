export interface CalendarEvent {
  id: string;
  title: string;
  start: string | Date;
  end: string | Date;
  allDay?: boolean;
  resourceId?: string;
  color?: string;
  textColor?: string;
  backgroundColor?: string;
  borderColor?: string;
  extendedProps?: {
    patientId?: number;
    patientName?: string;
    doctorId?: number;
    doctorName?: string;
    appointmentType?: string;
    status?: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
    isBlockedTime?: boolean;
    blockCategory?: 'lunch' | 'meeting' | 'vacation' | 'other';
    notes?: string;
    recurrenceRule?: string;
    [key: string]: any;
  };
}