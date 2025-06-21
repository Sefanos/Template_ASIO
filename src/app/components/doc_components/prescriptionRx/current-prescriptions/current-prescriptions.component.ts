import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Prescription } from '../../../../models/prescription.model';
import { MedicationService } from '../../../../services/doc-services/medication.service';
import { PrescriptionMedicationAdapter } from '../../../../services/doc-services/prescription-medication-adapter';
import { AuthService } from '../../../../core/auth/auth.service';

// ✅ NEW: Interface for confirmation modal
interface ConfirmationModal {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  confirmButtonClass: string;
  onConfirm: () => void;
  onCancel: () => void;
  isProcessing: boolean;
}

@Component({
  selector: 'app-current-prescriptions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './current-prescriptions.component.html',
  styleUrl: './current-prescriptions.component.css'
})
export class CurrentPrescriptionsComponent implements OnInit {
  @Input() patientId: number | null = null;
  @Output() editRequested = new EventEmitter<Prescription>();
  
  showAll = false;
  prescriptions: Prescription[] = [];
  loading = false;
  
  // ✅ NEW: Confirmation modal state
  confirmationModal: ConfirmationModal = {
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    confirmButtonClass: 'btn-primary',
    onConfirm: () => {},
    onCancel: () => {},
    isProcessing: false
  };
  
  constructor(
    private medicationService: MedicationService,
    private authService: AuthService
  ) {}
  
  ngOnInit(): void {
    this.loadPrescriptions();
  }
  
  // ✅ NEW: Generic confirmation modal opener
  private openConfirmationModal(config: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    confirmButtonClass?: string;
    onConfirm: () => void;
  }): void {
    this.confirmationModal = {
      isOpen: true,
      title: config.title,
      message: config.message,
      confirmText: config.confirmText || 'Confirm',
      cancelText: config.cancelText || 'Cancel',
      confirmButtonClass: config.confirmButtonClass || 'btn-primary',
      onConfirm: config.onConfirm,
      onCancel: () => this.closeConfirmationModal(),
      isProcessing: false
    };
  }
  
  // ✅ NEW: Close confirmation modal
  private closeConfirmationModal(): void {
    this.confirmationModal.isOpen = false;
    this.confirmationModal.isProcessing = false;
  }
  
  // ✅ NEW: Handle modal confirm action
  onModalConfirm(): void {
    this.confirmationModal.isProcessing = true;
    this.confirmationModal.onConfirm();
  }
  
  // ✅ NEW: Handle modal cancel action
  onModalCancel(): void {
    this.confirmationModal.onCancel();
  }
  
  async loadPrescriptions(): Promise<void> {
    if (!this.patientId) {
      this.prescriptions = [];
      return;
    }

    this.loading = true;
    
    try {
      console.log('Loading prescriptions for patient:', this.patientId);
      
      const medications = await this.medicationService.getPatientMedications(this.patientId);
      
      console.log('Loaded medications:', medications);
      
      this.prescriptions = medications.map(medication => 
        PrescriptionMedicationAdapter.medicationToPrescription(medication, this.authService)
      );
      
      console.log('Converted to prescriptions:', this.prescriptions);
      
    } catch (error) {
      console.error('Error loading prescriptions:', error);
      this.prescriptions = [];
    } finally {
      this.loading = false;
    }
  }
  
  refreshPrescriptions(): void {
    this.loadPrescriptions();
  }
  
  get displayedPrescriptions(): Prescription[] {
    if (this.showAll) {
      return this.prescriptions;
    } else {
      return this.prescriptions.filter(p => p.status === 'active');
    }
  }
  
  showAllPrescriptions(): void {
    this.showAll = !this.showAll;
  }
  
  editPrescription(prescription: Prescription): void {
    // ✅ UPDATED: Use confirmation modal for edit
    this.openConfirmationModal({
      title: 'Edit Prescription',
      message: `Are you sure you want to edit the prescription for "${prescription.medication}"? Any unsaved changes in the current form will be lost.`,
      confirmText: 'Edit Prescription',
      cancelText: 'Cancel',
      confirmButtonClass: 'bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors',
      onConfirm: () => {
        this.editRequested.emit(prescription);
        this.closeConfirmationModal();
      }
    });
  }
  
  // ✅ UPDATED: Use confirmation modal for cancel
  cancelPrescription(prescription: Prescription): void {
    if (!prescription.id) return;
    
    this.openConfirmationModal({
      title: 'Cancel Prescription',
      message: `Are you sure you want to cancel the prescription for "${prescription.medication}"?\n\nThis action cannot be undone and the prescription will be marked as cancelled.`,
      confirmText: 'Yes, Cancel Prescription',
      cancelText: 'Keep Prescription',
      confirmButtonClass: 'bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors',
      onConfirm: async () => {
        await this.performCancelPrescription(prescription);
      }
    });
  }
  
  // ✅ NEW: Separate method for actual cancellation logic
  private async performCancelPrescription(prescription: Prescription): Promise<void> {
    try {
      console.log('Cancelling prescription:', prescription.id);
      
      const medicationData = PrescriptionMedicationAdapter.prescriptionToMedication(
        { ...prescription, status: 'cancelled' }, 
        this.patientId!,
        this.authService
      );
      
      await this.medicationService.updateMedication(prescription.id!, medicationData);
      
      await this.loadPrescriptions();
      
      this.closeConfirmationModal();
      
      // ✅ NEW: Success notification
      this.showSuccessMessage('Prescription cancelled successfully');
      
    } catch (error) {
      console.error('Error cancelling prescription:', error);
      this.closeConfirmationModal();
      
      // ✅ NEW: Error notification
      this.showErrorMessage('Error cancelling prescription. Please try again.');
    }
  }
  
  // ✅ NEW: Reactivate prescription with confirmation
  reactivatePrescription(prescription: Prescription): void {
    if (!prescription.id) return;
    
    this.openConfirmationModal({
      title: 'Reactivate Prescription',
      message: `Are you sure you want to reactivate the prescription for "${prescription.medication}"?\n\nThis will change the status back to active.`,
      confirmText: 'Yes, Reactivate',
      cancelText: 'Cancel',
      confirmButtonClass: 'bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors',
      onConfirm: async () => {
        await this.performReactivatePrescription(prescription);
      }
    });
  }
  
  // ✅ NEW: Reactivate prescription logic
  private async performReactivatePrescription(prescription: Prescription): Promise<void> {
    try {
      console.log('Reactivating prescription:', prescription.id);
      
      const medicationData = PrescriptionMedicationAdapter.prescriptionToMedication(
        { ...prescription, status: 'active' }, 
        this.patientId!,
        this.authService
      );
      
      await this.medicationService.updateMedication(prescription.id!, medicationData);
      
      await this.loadPrescriptions();
      
      this.closeConfirmationModal();
      this.showSuccessMessage('Prescription reactivated successfully');
      
    } catch (error) {
      console.error('Error reactivating prescription:', error);
      this.closeConfirmationModal();
      this.showErrorMessage('Error reactivating prescription. Please try again.');
    }
  }
  
  // ✅ NEW: Delete prescription with strong confirmation
  deletePrescription(prescription: Prescription): void {
    if (!prescription.id) return;
    
    this.openConfirmationModal({
      title: 'Delete Prescription',
      message: `⚠️ WARNING: You are about to permanently delete the prescription for "${prescription.medication}".\n\nThis action cannot be undone and will remove all records of this prescription.\n\nAre you absolutely sure?`,
      confirmText: 'Yes, Delete Forever',
      cancelText: 'Keep Prescription',
      confirmButtonClass: 'bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded-md transition-colors font-semibold',
      onConfirm: async () => {
        await this.performDeletePrescription(prescription);
      }
    });
  }
  
  // ✅ NEW: Delete prescription logic
  private async performDeletePrescription(prescription: Prescription): Promise<void> {
    try {
      console.log('Deleting prescription:', prescription.id);
      
      await this.medicationService.deleteMedication(prescription.id!);
      
      await this.loadPrescriptions();
      
      this.closeConfirmationModal();
      this.showSuccessMessage('Prescription deleted successfully');
      
    } catch (error) {
      console.error('Error deleting prescription:', error);
      this.closeConfirmationModal();
      this.showErrorMessage('Error deleting prescription. Please try again.');
    }
  }
  
  // ✅ NEW: Success message system
  private showSuccessMessage(message: string): void {
    // Create temporary success notification
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
    
    // Animate in
    setTimeout(() => notification.classList.remove('translate-x-full'), 100);
    
    // Animate out and remove
    setTimeout(() => {
      notification.classList.add('translate-x-full');
      setTimeout(() => document.body.removeChild(notification), 300);
    }, 3000);
  }
  
  // ✅ NEW: Error message system
  private showErrorMessage(message: string): void {
    // Create temporary error notification
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 z-50 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 translate-x-full';
    notification.innerHTML = `
      <div class="flex items-center">
        <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
        </svg>
        ${message}
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => notification.classList.remove('translate-x-full'), 100);
    
    // Animate out and remove
    setTimeout(() => {
      notification.classList.add('translate-x-full');
      setTimeout(() => document.body.removeChild(notification), 300);
    }, 4000);
  }
  
  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'active':
        return 'bg-status-success/10 text-status-success';
      case 'draft':
        return 'bg-status-info/10 text-status-info';
      case 'completed':
        return 'bg-primary/10 text-primary';
      case 'cancelled':
        return 'bg-status-urgent/10 text-status-urgent';
      default:
        return 'bg-text/10 text-text';
    }
  }
  
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
}
