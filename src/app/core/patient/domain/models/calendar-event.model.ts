// src/app/core/models/calendar-event.model.ts (ou similaire)
export interface MyCalendarEvent {
    id?: string;
    title: string;
    start: string | Date; // Date ISO string or Date object
    end?: string | Date;   // Date ISO string or Date object
    allDay?: boolean;
    backgroundColor?: string;
    borderColor?: string;
    textColor?: string;
    extendedProps?: {
      description?: string;
      location?: string;
      status?: 'Pending' | 'Confirmed' | 'Cancelled' | 'Completed';
      resourceId?: string; // Pour lier à une légende/ressource
      patientEmail?: string;
      patientPhone?: string;
      doctorName?: string;
      doctorSpecialty?: string;
    };
  }
 
   
