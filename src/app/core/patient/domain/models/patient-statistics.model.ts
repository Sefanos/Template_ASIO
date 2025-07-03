/**
 * Représente les données de statistiques pour un patient, telles que reçues de l'API.
 */
export interface PatientStatistics {
  total_appointments: number;
  upcoming_appointments: number;
  active_medications: number;
  active_alerts: number;
  total_files: number;
  recent_vitals_count: number;
  lab_results_this_year: number;
  last_visit: string | null;
  next_appointment: string | null;
}

/**
 * Représente la structure de la réponse de l'API pour les statistiques.
 */
export interface PatientStatisticsResponse {
  success: boolean;
  message: string;
  data: PatientStatistics;
}