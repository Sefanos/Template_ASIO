// Notification interfaces for the ASIO healthcare system
export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  appointment_id?: number;
  reminder_type?: string;
  appointment_date?: string;
  action_url?: string;
  read_at: string | null;
  created_at: string;
  is_read: boolean;
  time_ago: string;
}

export interface NotificationData {
  title: string;
  message: string;
  appointment_id?: number;
  type: 'reminder' | 'appointment' | 'prescription' | 'lab_result' | 'system';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  action_url?: string;
}

export interface NotificationResponse {
  data: Notification[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface UnreadCountResponse {
  unread_count: number;
}

export interface NotificationActionResponse {
  success: boolean;
  message: string;
}

export interface UpcomingReminder {
  id: string;
  reminder_type: string;
  scheduled_for: string;
  appointment: {
    id: number;
    date: string;
    time: string;
    type: string;
    status: string;
    doctor?: {
      first_name: string;
      last_name: string;
      specialization?: string;
    };
  };
  message: string;
  time_until: string;
  can_cancel: boolean;
  can_reschedule: boolean;
}

export interface UpcomingRemindersResponse {
  data: UpcomingReminder[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}
