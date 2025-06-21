import { Prescription } from '../../models/prescription.model';
import { Medication } from './medication.service';
import { AuthService } from '../../core/auth/auth.service';


export class PrescriptionMedicationAdapter {
  
  /**
   * Convert Prescription model to Medication model for backend
   */
  static prescriptionToMedication(prescription: Prescription, patientId: number, authService?: AuthService): Partial<Medication> {
    // ✅ GET REAL DOCTOR ID from AuthService
    const currentUser = authService?.currentUserValue;
    const doctorUserId = currentUser?.id;
    
    // ✅ VALIDATE: Ensure we have a valid doctor ID
    if (!doctorUserId) {
      console.error('No authenticated doctor found! Cannot create prescription.');
      throw new Error('Authentication required: No doctor logged in');
    }
    
    return {
      patient_id: patientId,
      chart_patient_id: patientId,
      doctor_user_id: doctorUserId, // ✅ REAL doctor ID
      medication_name: prescription.medication,
      dosage: prescription.dosage,
      frequency: this.extractFrequency(prescription.instructions),
      duration: this.calculateDuration(prescription.startDate, prescription.endDate),
      start_date: this.formatDateForAPI(prescription.startDate),
      end_date: prescription.endDate ? this.formatDateForAPI(prescription.endDate) : null,
      instructions: prescription.instructions || '',
      refills_allowed: prescription.refills.toString(),
      status: prescription.status || 'active'
    };
  }

  /**
   * Convert Medication model back to Prescription model for frontend
   */
  static medicationToPrescription(medication: Medication, authService?: AuthService): Prescription {
    // ✅ GET REAL DOCTOR NAME from AuthService
    const prescribedByText = this.getDoctorName(medication.doctor_user_id, authService);
    
    return {
      id: medication.id,
      patientId: medication.patient_id,
      medication: medication.medication_name,
      dosage: medication.dosage,
      form: this.extractForm(medication.medication_name),
      instructions: medication.instructions || '',
      quantity: 30, // Default value
      refills: parseInt(medication.refills_allowed) || 0,
      startDate: this.formatDateForFrontend(medication.start_date),
      endDate: this.calculateSafeEndDate(medication.start_date, medication.duration),
      status: medication.status as 'draft' | 'active' | 'completed' | 'cancelled' || 'active',
      prescribedBy: prescribedByText, // ✅ REAL doctor name
      prescribedDate: this.formatDateForFrontend(medication.created_at || medication.start_date),
      sendToPharmacy: false,
      pharmacistNotes: ''
    };
  }

  /**
   * ✅ NEW: Safe date formatter for API (YYYY-MM-DD format)
   */
  private static formatDateForAPI(dateInput: string | Date): string {
    try {
      if (!dateInput) {
        return new Date().toISOString().split('T')[0]; // Today's date in YYYY-MM-DD format
      }

      let date: Date;
      if (typeof dateInput === 'string') {
        // Handle different string formats
        if (dateInput.includes('T')) {
          // ISO string
          date = new Date(dateInput);
        } else if (dateInput.match(/^\d{4}-\d{2}-\d{2}$/)) {
          // YYYY-MM-DD format
          date = new Date(dateInput + 'T00:00:00.000Z');
        } else {
          // Try parsing as-is
          date = new Date(dateInput);
        }
      } else {
        date = dateInput;
      }

      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.warn('Invalid date provided:', dateInput, 'Using current date');
        return new Date().toISOString().split('T')[0];
      }

      return date.toISOString().split('T')[0]; // Return YYYY-MM-DD format
    } catch (error) {
      console.error('Error formatting date for API:', error, 'Input:', dateInput);
      return new Date().toISOString().split('T')[0]; // Fallback to current date
    }
  }

  /**
   * ✅ NEW: Safe date formatter for frontend
   */
  private static formatDateForFrontend(dateInput: string): string {
    try {
      if (!dateInput) {
        return new Date().toISOString();
      }

      const date = new Date(dateInput);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.warn('Invalid date provided:', dateInput, 'Using current date');
        return new Date().toISOString();
      }

      return date.toISOString();
    } catch (error) {
      console.error('Error formatting date for frontend:', error, 'Input:', dateInput);
      return new Date().toISOString(); // Fallback to current date
    }
  }

  /**
   * ✅ FIXED: Safe end date calculation
   */
  private static calculateSafeEndDate(startDate: string, duration: string): string {
    try {
      if (!startDate) {
        console.warn('No start date provided for end date calculation');
        return new Date().toISOString();
      }

      const start = new Date(startDate);
      
      // Check if start date is valid
      if (isNaN(start.getTime())) {
        console.warn('Invalid start date:', startDate, 'Using current date');
        return new Date().toISOString();
      }

      const days = this.extractDaysFromDuration(duration);
      const end = new Date(start.getTime() + (days * 24 * 60 * 60 * 1000));
      
      // Check if end date is valid
      if (isNaN(end.getTime())) {
        console.warn('Invalid end date calculated, using 7 days from start');
        const fallbackEnd = new Date(start.getTime() + (7 * 24 * 60 * 60 * 1000));
        return fallbackEnd.toISOString();
      }

      return end.toISOString();
    } catch (error) {
      console.error('Error calculating end date:', error);
      // Return 7 days from now as fallback
      const fallback = new Date();
      fallback.setDate(fallback.getDate() + 7);
      return fallback.toISOString();
    }
  }

  /**
   * Calculate duration from start and end dates
   */
  private static calculateDuration(startDate: string, endDate?: string): string {
    try {
      if (!endDate) return '7 days'; // default
      
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      // Check if dates are valid
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        console.warn('Invalid dates for duration calculation:', { startDate, endDate });
        return '7 days';
      }
      
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return `${diffDays} days`;
    } catch (error) {
      console.error('Error calculating duration:', error);
      return '7 days';
    }
  }

  /**
   * Extract number of days from duration string
   */
  private static extractDaysFromDuration(duration: string): number {
    try {
      if (!duration) return 7; // default
      
      const match = duration.match(/(\d+)\s*(day|week|month)/i);
      if (match) {
        const num = parseInt(match[1]);
        const unit = match[2].toLowerCase();
        
        if (unit.startsWith('week')) return num * 7;
        if (unit.startsWith('month')) return num * 30;
        return num; // days
      }
      
      return 7; // default
    } catch (error) {
      console.error('Error extracting days from duration:', error);
      return 7;
    }
  }

  /**
   * ✅ UPDATED: Get REAL doctor name from user ID
   */
  private static getDoctorName(doctorUserId: number, authService?: AuthService): string {
    try {
      if (!authService) {
        return `Doctor (ID: ${doctorUserId})`;
      }

      const currentUser = authService.currentUserValue;
      
      // If it's the current logged-in user
      if (currentUser && currentUser.id === doctorUserId) {  
        // Fallback to username if no first/last name
        if (currentUser.name) {
          return `${currentUser.name}`;
        }
        
        // Last fallback
        return `Dr. (ID: ${doctorUserId})`;
      }
      
      // ✅ FOR OTHER DOCTORS: In a real app, you'd lookup doctor by ID
      // For now, show ID until you implement doctor lookup service
      return `Doctor (ID: ${doctorUserId})`;
      
    } catch (error) {
      console.error('Error getting doctor name:', error);
      return `Doctor (ID: ${doctorUserId})`;
    }
  }

  /**
   * Extract frequency from instructions
   */
  private static extractFrequency(instructions: string): string {
    if (!instructions) return 'Once daily';
    
    const lower = instructions.toLowerCase();
    
    if (lower.includes('once') || lower.includes('1 time')) return 'Once daily';
    if (lower.includes('twice') || lower.includes('2 times')) return 'Twice daily';
    if (lower.includes('three times') || lower.includes('3 times')) return 'Three times daily';
    if (lower.includes('four times') || lower.includes('4 times')) return 'Four times daily';
    if (lower.includes('every 8 hours')) return 'Every 8 hours';
    if (lower.includes('every 6 hours')) return 'Every 6 hours';
    if (lower.includes('every 4 hours')) return 'Every 4 hours';
    
    return 'As needed';
  }

  /**
   * Extract form from medication name
   */
  private static extractForm(medicationName: string): string {
    if (!medicationName) return 'Tablet';
    
    const name = medicationName.toLowerCase();
    
    if (name.includes('tablet') || name.includes('tab')) return 'Tablet';
    if (name.includes('capsule') || name.includes('cap')) return 'Capsule';
    if (name.includes('syrup') || name.includes('liquid')) return 'Syrup';
    if (name.includes('injection') || name.includes('inj')) return 'Injection';
    if (name.includes('cream') || name.includes('ointment')) return 'Cream';
    if (name.includes('drops')) return 'Drops';
    
    return 'Tablet';
  }

  /**
   * Validate prescription data before conversion
   */
  static validatePrescription(prescription: Prescription): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!prescription.medication?.trim()) {
      errors.push('Medication name is required');
    }
    if (!prescription.dosage?.trim()) {
      errors.push('Dosage is required');
    }
    if (!prescription.instructions?.trim()) {
      errors.push('Instructions are required');
    }
    if (!prescription.startDate?.trim()) {
      errors.push('Start date is required');
    }
    if (prescription.quantity <= 0) {
      errors.push('Quantity must be greater than 0');
    }
    if (prescription.refills < 0) {
      errors.push('Refills cannot be negative');
    }

    // ✅ NEW: Validate dates
    try {
      if (prescription.startDate) {
        const startDate = new Date(prescription.startDate);
        if (isNaN(startDate.getTime())) {
          errors.push('Invalid start date format');
        }
      }
      
      if (prescription.endDate) {
        const endDate = new Date(prescription.endDate);
        if (isNaN(endDate.getTime())) {
          errors.push('Invalid end date format');
        }
      }
    } catch (error) {
      errors.push('Date validation error');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}