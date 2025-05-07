export interface VitalSign {
  id: number;
  date: string;
  systolic: number;
  diastolic: number;
  pulse: number;
  temperature: number;
  respiratoryRate: number;
  oxygenSaturation: number;
  weight: number;
  height: number;
  patientId?: number;
  // Additional fields to represent history
  previousReading?: {
    date: string;
    value: number;
  };
}