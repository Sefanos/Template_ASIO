export interface VitalSign {
  id: number;
  patient_id: number;
  recorded_by_user_id: number;
  blood_pressure_systolic: number;
  blood_pressure_diastolic: number;
  pulse_rate: number;
  temperature: string;
  temperature_unit: string;
  respiratory_rate: number;
  oxygen_saturation: number;
  weight: string;
  weight_unit: string;
  height: string;
  height_unit: string;
  notes: string | null;
  recorded_at: string; // ISO date string
  created_at: string;
  updated_at: string;
}

export interface VitalSignsApiResponse {
    success: boolean;
    message: string;
    data: VitalSign[];
}