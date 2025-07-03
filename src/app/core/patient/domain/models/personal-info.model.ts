export interface PersonalInfo {
  id?: number;
  userId?: number; // Assuming this comes from the backend
  patientId?: number; // Assuming this comes from the backend

  name: string;
  surname: string;
  email: string;
  phone: string; // 

  birthdate: string | null; // Expecting YYYY-MM-DD string
  gender: string | null;
  address: string | null;

  
  emergency_contact: string | null;
  marital_status: string | null;
  blood_type: string | null;
  nationality: string | null;

  profile_image: string | null; // Keep as snake_case as used in your component template and logic
                                // Or rename to profileImageUrl and adjust component.
                                // For consistency, if others are camelCase, this should be too (e.g. profileImageUrl)
                                // I'll keep profile_image for now to match your existing component.

  // Timestamps (optional)
  createdAt?: string;
  updatedAt?: string;
}