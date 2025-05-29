export interface Appointment {
        id: number;
       
        doctorId: number;
        doctorName?: string; // Added for convenience
        date: string | Date; // Can be string from API, converted to Date in service/component
        time: string;
        reason?: string;
        status: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled' | 'Unknown';
        cancelReason?: string;
        doctorSpecialty?: string;
        location?: string;
        notes?: string[]; // Or a more specific type if available
        followUp?: boolean;
        // Add other relevant properties as needed
      }
