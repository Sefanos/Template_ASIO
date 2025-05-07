export interface Note {
  id: number;
  date: string;
  provider: string;
  content: string;
  type: 'progress' | 'consultation' | 'procedure' | 'quick';
  patientId?: number;
  // Additional fields
  title?: string;
  followUpRequired?: boolean;
  followUpDate?: string;
  attachments?: string[];
  tags?: string[];
}