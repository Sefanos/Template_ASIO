export interface TimelineEvent {
  id: number;
  date: string;
  type: 'appointment' | 'medication' | 'labResult' | 'diagnosis' | 'note';
  title: string;
  description: string;
  provider?: string;
  status?: string;
  patientId?: number;
  // Additional fields
  relatedItemId?: number; // ID of the associated appointment, medication, etc.
  importance?: 'low' | 'medium' | 'high';
  actionRequired?: boolean;
  actionDescription?: string;
}