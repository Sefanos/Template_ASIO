import { VitalSign } from "./VitalSign.model";

export interface VitalSignsData {
    lastRecorded: string | null; // Attendre une chaîne ISO 8601 du backend
    bloodPressure?: VitalSign;
    pulse?: VitalSign;
    temperature?: VitalSign;
    respiratoryRate?: VitalSign;
    oxygenSaturation?: VitalSign;
    weight?: VitalSign;
    height?: VitalSign;
  }