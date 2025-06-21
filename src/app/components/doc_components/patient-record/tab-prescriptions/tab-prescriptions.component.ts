import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { Patient } from '../../../../models/patient.model';
import { MedicationService } from '../../../../services/doc-services/medication.service';
import { PrescriptionFormComponent } from '../../../doc_components/prescriptionRx/prescription-form/prescription-form.component';
import { Prescription } from '../../../../models/prescription.model';
import { PrescriptionMedicationAdapter } from '../../../../services/doc-services/prescription-medication-adapter';
import { AuthService } from '../../../../core/auth/auth.service';

interface Medication {
  id: number;
  chart_patient_id: number | null;
  doctor_user_id: number;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  start_date: string;
  end_date: string | null;
  instructions: string;
  refills_allowed: string;
  status: 'active' | 'discontinued' | 'expired' | 'completed';
  created_at: string;
  updated_at: string;
  patient_id: number;
  // Additional computed fields
  days_remaining?: number;
  is_expiring_soon?: boolean;
  doctor_name?: string;
}

interface DiscontinueRequest {
  reason: string;
  notes: string;
}

@Component({
  selector: 'app-tab-prescriptions',
  standalone: true,
  imports: [CommonModule, FormsModule , PrescriptionFormComponent],
  templateUrl: './tab-prescriptions.component.html',
  styleUrls: ['./tab-prescriptions.component.css']
})
export class TabPrescriptionsComponent implements OnInit, OnDestroy {
  @Input() patient: Patient | null = null;
  
  // Data properties
  medications: Medication[] = [];
  filteredMedications: Medication[] = [];
  loading: boolean = false;
  error: string | null = null;
  
  // Filter and search
  searchTerm: string = '';
  statusFilter: string = 'all'; // all, active, discontinued, expired
  sortBy: string = 'start_date'; // start_date, medication_name, status
  sortOrder: 'asc' | 'desc' = 'desc';
  
  // Modal states
  showDiscontinueModal: boolean = false;
  showEditModal: boolean = false;
  showDeleteModal: boolean = false;
  selectedMedication: Medication | null = null;
  
  // Discontinue form
  discontinueForm = {
    reason: '',
    notes: ''
  };
  
  // Statistics
  medicationStats = {
    total: 0,
    active: 0,
    discontinued: 0,
    expired: 0,
    expiring_soon: 0
  };
  
  // Edit form properties
  showEditForm = false;
  medicationToEdit: Medication | null = null;
  
  private destroy$ = new Subject<void>();
  
  constructor(
    private medicationService: MedicationService,
    private router: Router,
    private authService: AuthService
  ) {}
  
  ngOnInit(): void {
    if (this.patient?.id) {
      this.loadMedications();
    }
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  // ===== DATA LOADING =====
  
  async loadMedications() {
    if (!this.patient?.id) return;
    
    this.loading = true;
    this.error = null;
    
    try {
      this.medications = await this.medicationService.getPatientMedications(this.patient.id) as Medication[];
      this.processMedications();
      this.applyFilters();
      this.calculateStats();
    } catch (error: any) {
      this.error = error.message || 'Failed to load medications';
      console.error('Error loading medications:', error);
    } finally {
      this.loading = false;
    }
  }
  
  private processMedications() {
    // Add computed fields to medications
    this.medications = this.medications.map(med => ({
      ...med,
      days_remaining: this.calculateDaysRemaining(med),
      is_expiring_soon: this.isExpiringSoon(med),
      doctor_name: this.getDoctorName(med.doctor_user_id)
    }));
  }
  
  private calculateDaysRemaining(medication: Medication): number | undefined {
    if (!medication.end_date) return undefined;
    
    const endDate = new Date(medication.end_date);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  }
  
  private isExpiringSoon(medication: Medication): boolean {
    if (!medication.days_remaining) return false;
    return medication.days_remaining <= 7 && medication.status === 'active';
  }
  
  private getDoctorName(doctorId: number): string {
    // TODO: Get from doctor service or API
    return `Dr. ${doctorId === 2 ? 'Sefanos' : 'Unknown'}`;
  }
  
  // ===== FILTERING & SEARCH =====
  
  onSearchChange() {
    this.applyFilters();
  }
  
  onStatusFilterChange() {
    this.applyFilters();
  }
  
  onSortChange() {
    this.applyFilters();
  }
  
  private applyFilters() {
    let filtered = [...this.medications];
    
    // Apply search filter
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(med =>
        med.medication_name.toLowerCase().includes(term) ||
        med.dosage.toLowerCase().includes(term) ||
        med.instructions.toLowerCase().includes(term)
      );
    }
    
    // Apply status filter
    if (this.statusFilter !== 'all') {
      filtered = filtered.filter(med => med.status === this.statusFilter);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let aVal: any, bVal: any;
      
      switch (this.sortBy) {
        case 'medication_name':
          aVal = a.medication_name.toLowerCase();
          bVal = b.medication_name.toLowerCase();
          break;
        case 'start_date':
          aVal = new Date(a.start_date);
          bVal = new Date(b.start_date);
          break;
        case 'status':
          aVal = a.status;
          bVal = b.status;
          break;
        default:
          aVal = a.start_date;
          bVal = b.start_date;
      }
      
      if (aVal < bVal) return this.sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return this.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    
    this.filteredMedications = filtered;
  }
  
  private calculateStats() {
    this.medicationStats = {
      total: this.medications.length,
      active: this.medications.filter(m => m.status === 'active').length,
      discontinued: this.medications.filter(m => m.status === 'discontinued').length,
      expired: this.medications.filter(m => m.status === 'expired').length,
      expiring_soon: this.medications.filter(m => m.is_expiring_soon).length
    };
  }
  
  // ===== MEDICATION ACTIONS =====
  
  openDiscontinueModal(medication: Medication) {
    this.selectedMedication = medication;
    this.discontinueForm = { reason: '', notes: '' };
    this.showDiscontinueModal = true;
  }
  
  async discontinueMedication() {
    if (!this.selectedMedication || !this.discontinueForm.reason.trim()) return;
    
    try {
      await this.medicationService.discontinueMedication(
        this.selectedMedication.id,
        this.discontinueForm
      );
      
      // Update local state
      const index = this.medications.findIndex(m => m.id === this.selectedMedication!.id);
      if (index !== -1) {
        this.medications[index].status = 'discontinued';
        this.medications[index].updated_at = new Date().toISOString();
      }
      
      this.applyFilters();
      this.calculateStats();
      this.closeDiscontinueModal();
      
      console.log('Medication discontinued successfully');
      
    } catch (error: any) {
      console.error('Error discontinuing medication:', error);
      this.error = error.message || 'Failed to discontinue medication';
    }
  }
  
  openEditModal(medication: Medication) {
    this.selectedMedication = medication;
    this.medicationToEdit = medication;
    this.showEditForm = true;
    this.showEditModal = true; // Keep this for now
  }
  
  openDeleteModal(medication: Medication) {
    this.selectedMedication = medication;
    this.showDeleteModal = true;
  }
  
  async deleteMedication() {
    if (!this.selectedMedication) return;
    
    try {
      await this.medicationService.deleteMedication(this.selectedMedication.id);
      
      // Remove from local state
      this.medications = this.medications.filter(m => m.id !== this.selectedMedication!.id);
      this.applyFilters();
      this.calculateStats();
      this.closeDeleteModal();
      
      console.log('Medication deleted successfully');
      
    } catch (error: any) {
      console.error('Error deleting medication:', error);
      this.error = error.message || 'Failed to delete medication';
    }
  }
  
  // ===== MODAL MANAGEMENT =====
  
  closeDiscontinueModal() {
    this.showDiscontinueModal = false;
    this.selectedMedication = null;
    this.discontinueForm = { reason: '', notes: '' };
  }
  
  closeEditModal() {
    this.showEditModal = false;
    this.selectedMedication = null;
  }
  
  closeDeleteModal() {
    this.showDeleteModal = false;
    this.selectedMedication = null;
  }
  
  // Close edit form
  closeEditForm(): void {
    this.showEditForm = false;
    this.medicationToEdit = null;
    this.selectedMedication = null;
  }
  
  // Handle medication update completion
  onMedicationUpdated(updatedMedication: any): void {
    console.log('Medication updated:', updatedMedication);
    
    // Refresh the medications list
    this.loadMedications();
    this.closeEditForm();
    this.showSuccessMessage('Medication updated successfully!');
  }
  
  // Handle form cancellation
  onEditFormCancelled(): void {
    this.closeEditForm();
  }
  
  // Convert Medication to Prescription for the form
  convertMedicationToPrescription(medication: Medication): Prescription {
    return {
      id: medication.id,
      patientId: medication.patient_id,
      medication: medication.medication_name,
      dosage: medication.dosage,
      form: this.extractMedicationForm(medication.medication_name), // Extract from name or default
      instructions: medication.instructions,
      quantity: this.calculateQuantityFromDuration(medication.duration), // Calculate or default
      refills: parseInt(medication.refills_allowed) || 0,
      startDate: medication.start_date,
      endDate: medication.end_date || '',
      status: medication.status as any,
      prescribedBy: '', // Will be set by adapter
      prescribedDate: medication.created_at || medication.start_date,
      sendToPharmacy: false,
      pharmacistNotes: ''
    };
  }
  
  // Helper method to extract form from medication name
  private extractMedicationForm(medicationName: string): string {
    const name = medicationName.toLowerCase();
    if (name.includes('tablet') || name.includes('tab')) return 'tablet';
    if (name.includes('capsule') || name.includes('cap')) return 'capsule';
    if (name.includes('liquid') || name.includes('syrup')) return 'liquid';
    if (name.includes('injection') || name.includes('shot')) return 'injection';
    if (name.includes('inhaler') || name.includes('spray')) return 'inhaler';
    if (name.includes('patch')) return 'patch';
    if (name.includes('cream') || name.includes('ointment')) return 'cream';
    return 'tablet'; // Default
  }
  
  // Helper method to calculate quantity from duration
  private calculateQuantityFromDuration(duration: string): number {
    // Try to extract number from duration string
    const match = duration.match(/(\d+)/);
    if (match) {
      const days = parseInt(match[1]);
      if (duration.toLowerCase().includes('day')) {
        return Math.min(days, 90); // Cap at 90 days supply
      }
      if (duration.toLowerCase().includes('week')) {
        return Math.min(days * 7, 90);
      }
      if (duration.toLowerCase().includes('month')) {
        return Math.min(days * 30, 90);
      }
    }
    return 30; // Default quantity
  }
  
  // Success message method
  private showSuccessMessage(message: string): void {
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 translate-x-full';
    notification.innerHTML = `
      <div class="flex items-center">
        <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
        </svg>
        ${message}
      </div>
    `;
    
    document.body.appendChild(notification);
    setTimeout(() => notification.classList.remove('translate-x-full'), 100);
    setTimeout(() => {
      notification.classList.add('translate-x-full');
      setTimeout(() => document.body.removeChild(notification), 300);
    }, 3000);
  }
  
  refreshMedications() {
    this.loadMedications();
  }
  
  // Navigation methods (keep existing functionality)
  navigateToPrescription(prescriptionId: number): void {
    this.router.navigate(['/doctor/prescription', prescriptionId]);
  }

createNewPrescription() {
  if (!this.patient?.id) {
    console.error('No patient selected');
    return;
  }

  console.log('Navigating to prescription form for patient:', this.patient);
  
  // Navigate to prescription-rx with patient context
  this.router.navigate(['/doctor/prescription'], {
    queryParams: {
      patient_id: this.patient.id,
      patient_name: `${this.patient.name}`,
      patient_dob: this.patient.dob,
      from_patient_record: true
    }
  });
}
  
  trackByMedicationId(index: number, medication: Medication): number {
    return medication.id;
  }

  // ✅ MISSING: Status badge color method
  getStatusColor(status: string): string {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'discontinued':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  // ✅ MISSING: Status icon method
  getStatusIcon(status: string): string {
    switch (status) {
      case 'active':
        return '🟢';
      case 'discontinued':
        return '🔴';
      case 'expired':
        return '⏰';
      case 'completed':
        return '✅';
      default:
        return '❓';
    }
  }

  // ✅ MISSING: Date formatting method
  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  }
}
