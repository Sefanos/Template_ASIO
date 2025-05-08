export interface Prescription {
  id?: number;
  patientId: number;
  medication: string;
  dosage: string;
  form: string;
  instructions: string;
  quantity: number;
  refills: number;
  startDate: string;
  endDate?: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  prescribedBy: string;
  prescribedDate: string;
  sendToPharmacy: boolean;
  pharmacistNotes?: string;
}

export interface PrescriptionTemplate {
  id: number;
  name: string;
  medication: string;
  dosage: string;
  form: string;
  instructions: string;
  quantity: number;
  refills: number;
}