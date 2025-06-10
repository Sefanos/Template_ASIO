// export interface Patient {
//     id: number;
//     name: string;
//     email?: string;
//     phone?: string;
//     dob?: string | Date;
//     gender?: string;
//     address?: string;
//     insuranceNumber?: string;
//     emergencyContact?: {
//         name: string;
//         phone: string;
//         relationship: string;
//     };
//     medicalHistory?: any[];
//     profileImage?: string;
// }

import { PersonalInfo } from './personal-info.model';

export interface Patient {
  id: number;       // Patient's own ID
  userId: number;   // Associated User ID

 
 // Other specific patient fields if any, e.g.:
  // medicalRecordNumber?: string;
  // registrationDate?: string;

  personalInfo: PersonalInfo;
}
