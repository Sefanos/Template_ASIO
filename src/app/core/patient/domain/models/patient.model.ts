export interface Patient {
    id: number;
    name: string;
    email?: string;
    phone?: string;
    dob?: string | Date;
    gender?: string;
    address?: string;
    insuranceNumber?: string;
    emergencyContact?: {
        name: string;
        phone: string;
        relationship: string;
    };
    medicalHistory?: any[];
    profileImage?: string;
}
