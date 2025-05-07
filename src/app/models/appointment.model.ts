export interface Appointment {
  id: number;
  date: string;
  time: string;
  type: string;
  provider: string;
  reason: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
}