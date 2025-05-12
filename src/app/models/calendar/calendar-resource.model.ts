export interface CalendarResource {
  id: string;
  title: string;
  eventColor?: string;
  eventTextColor?: string;
  businessHours?: {
    startTime: string;
    endTime: string;
    daysOfWeek: number[]; // 0=Sunday, 1=Monday, etc.
  }[];
  extendedProps?: {
    type: 'doctor' | 'staff' | 'room';
    specialty?: string;
    capacity?: number;
    image?: string;
    [key: string]: any;
  };
}