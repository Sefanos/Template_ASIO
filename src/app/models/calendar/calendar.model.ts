export interface CalendarEvent {
  id: string;
  title: string;
  start: Date | string;
  end: Date | string;
  allDay?: boolean;
  resourceId?: string;
  color?: string;
  textColor?: string;
  backgroundColor?: string; 
  borderColor?: string;     
  extendedProps?: any;
}

export interface CalendarResource {
  id: string;
  title: string;
  eventColor?: string;
  businessHours?: {
    startTime: string;
    endTime: string;
    daysOfWeek: number[];
  }[];
  extendedProps?: any;
}

export interface TimeSlot {
  time: string;
  available: boolean;
  duration?: number;
}