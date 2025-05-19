export interface Appointment {
    id: number;
    date: string | Date;
    time?: string; 
    reason?: string;
    status?: string;
    doctor?: { 
        id: number; 
        name: string; 
        specialty: string; 
    };
}
