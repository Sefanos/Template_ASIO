/**
 * Représente un enregistrement d'historique médical après l'analyse des chaînes JSON.
 */
export interface MedicalHistoryRecord {
  id: number;
  patient_id: number;
  current_medical_conditions: string[];
  past_surgeries: string[];
  chronic_diseases: string[];
  current_medications: string[];
  allergies: string[];
  last_updated: string;
  created_at: string;
  updated_at: string;
}

/**
 * Représente un enregistrement brut tel que reçu de l'API avec des chaînes JSON.
 */
export interface RawMedicalHistoryRecord {
  id: number;
  patient_id: number;
  current_medical_conditions: string; // JSON string
  past_surgeries: string; // JSON string
  chronic_diseases: string; // JSON string
  current_medications: string; // JSON string
  allergies: string; // JSON string
  last_updated: string;
  updated_by_user_id: number;
  created_at: string;
  updated_at: string;
}

/**
 * Représente la structure de la réponse complète de l'API.
 */
export interface MedicalHistoryApiResponse {
  success: boolean;
  message: string;
  data: RawMedicalHistoryRecord[];
}


/**
 * Représente les données des statistiques récapitulatives.
 */
export interface MedicalHistorySummary {
  conditions: number;
  chronic: number;
  surgeries: number;
  allergies: number;
  active_medications: number;
}

/**
 * Représente la structure de la réponse de l'API pour les statistiques.
 */
export interface MedicalHistorySummaryApiResponse {
  success: boolean;
  message: string;
  data: MedicalHistorySummary;
}