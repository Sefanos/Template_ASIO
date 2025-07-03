/**
 * Représente les informations sur le médecin prescripteur.
 */
export interface Doctor {
  id: number;
  name: string;
}

/**
 * Représente une prescription telle que retournée par l'API.
 */
export interface Prescription {
  id: number;
  doctor_user_id: number;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  start_date: string;
  end_date: string | null;
  instructions: string;
  refills_allowed: string;
  status: 'active' | 'completed' | 'cancelled' | string;
  patient_id: number;
  doctor: Doctor; // L'objet médecin est maintenant inclus
}

/**
 * Représente la structure de la réponse de l'API pour la liste des prescriptions.
 */
export interface PrescriptionResponse {
  success: boolean;
  message: string;
  data: Prescription[];
}