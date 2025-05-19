import { VitalSignsData } from "./VitalSignsData.model";

export interface MedicalHistoryData {
    currentMedicalConditions: string[];
    pastSurgeries: string[];
    chronicDiseases: string[];
    currentMedications: string[];
    allergies: string[];
    vitalSigns?: VitalSignsData | null; // Peut être null si aucune donnée de signe vital
    lastUpdated: string | null; // Attendre une chaîne ISO 8601 du backend
  }