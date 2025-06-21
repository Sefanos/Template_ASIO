import { Component, EventEmitter, Input, OnInit, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Prescription } from '../../../../models/prescription.model';
import { MedicationService } from '../../../../services/doc-services/medication.service';
import { PrescriptionMedicationAdapter } from '../../../../services/doc-services/prescription-medication-adapter';
import { AuthService } from '../../../../core/auth/auth.service';
import { TemplateService, PrescriptionTemplate } from '../../../../services/doc-services/template.service';

// ✅ Interface for confirmation modal
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
  selector: 'app-prescription-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './prescription-form.component.html',
  styleUrl: './prescription-form.component.css'
})
export class PrescriptionFormComponent implements OnInit, OnChanges {
  @Input() patientId: number | null = null;
  @Input() prescriptionToEdit: Prescription | null = null;
  @Output() prescriptionCreated = new EventEmitter<Prescription>();
  @Output() prescriptionUpdated = new EventEmitter<Prescription>();
  @Output() cancelled = new EventEmitter<void>();

  prescriptionForm: FormGroup;
  showTemplateDropdown = false;
  isEditing = false;
  
  // ✅ Confirmation modal state
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
  
  // Sample template data
  templates: PrescriptionTemplate[] = [];
  
  constructor(
    private fb: FormBuilder,
    private medicationService: MedicationService,
    private authService: AuthService,
    private templateService: TemplateService  // ✅ ADD THIS
  ) {
    this.prescriptionForm = this.createForm();
  }
  
  ngOnInit(): void {
    this.initializeForm();
    this.loadPatientInfo();
    this.loadTemplates(); // ✅ ADD THIS
    
    // Check for edit mode
    this.checkEditMode();
  }

  // ✅ Add OnChanges to detect input changes
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['prescriptionToEdit'] && this.prescriptionForm) {
      this.checkEditMode();
    }
  }

  // ✅ Check and handle edit mode
  private checkEditMode(): void {
    if (this.prescriptionToEdit) {
      console.log('Edit mode detected, loading prescription:', this.prescriptionToEdit);
      this.isEditing = true;
      this.loadPrescriptionForEdit();
    } else {
      this.isEditing = false;
    }
  }

  // ✅ Load prescription data for editing
  private loadPrescriptionForEdit(): void {
    if (!this.prescriptionToEdit || !this.prescriptionForm) return;
    
    console.log('Loading prescription for edit:', this.prescriptionToEdit);
    
    // Populate the form with existing data
    this.prescriptionForm.patchValue({
      medication: this.prescriptionToEdit.medication,
      dosage: this.prescriptionToEdit.dosage,
      form: this.prescriptionToEdit.form,
      instructions: this.prescriptionToEdit.instructions,
      quantity: this.prescriptionToEdit.quantity,
      refills: this.prescriptionToEdit.refills,
      startDate: this.prescriptionToEdit.startDate,
      endDate: this.prescriptionToEdit.endDate,
      sendToPharmacy: this.prescriptionToEdit.sendToPharmacy || false,
      pharmacistNotes: this.prescriptionToEdit.pharmacistNotes || ''
    });
    
    console.log('Form populated with prescription data');
  }

  // ✅ Initialize form and patient info
  private initializeForm(): void {
    // Form is already created in constructor
  }

  private loadPatientInfo(): void {
    // Load patient info if needed
  }
  
  // ✅ Generic confirmation modal opener
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
      confirmButtonClass: config.confirmButtonClass || 'bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors',
      onConfirm: config.onConfirm,
      onCancel: () => this.closeConfirmationModal(),
      isProcessing: false
    };
  }
  
  // ✅ Close confirmation modal
  private closeConfirmationModal(): void {
    this.confirmationModal.isOpen = false;
    this.confirmationModal.isProcessing = false;
  }
  
  // ✅ Handle modal confirm action
  onModalConfirm(): void {
    this.confirmationModal.isProcessing = true;
    this.confirmationModal.onConfirm();
  }
  
  // ✅ Handle modal cancel action
  onModalCancel(): void {
    this.confirmationModal.onCancel();
  }
  
  private createForm(): FormGroup {
    return this.fb.group({
      medication: ['', Validators.required],
      dosage: ['', Validators.required],
      form: ['tablet', Validators.required],
      instructions: ['', Validators.required],
      quantity: [30, [Validators.required, Validators.min(1)]],
      refills: [0, [Validators.required, Validators.min(0)]],
      startDate: [this.getCurrentDate(), Validators.required],
      endDate: [''],
      sendToPharmacy: [false],
      pharmacistNotes: ['']
    });
  }
  
  private getCurrentDate(): string {
    const now = new Date();
    return now.toISOString().split('T')[0];
  }
  
  toggleTemplateDropdown(): void {
    this.showTemplateDropdown = !this.showTemplateDropdown;
  }
  
  // ✅ Use confirmation for template usage
  useTemplate(template: PrescriptionTemplate): void {
    // Check if form has data
    const hasFormData = this.prescriptionForm.dirty || 
                       this.prescriptionForm.get('medication')?.value ||
                       this.prescriptionForm.get('dosage')?.value ||
                       this.prescriptionForm.get('instructions')?.value;
    
    if (hasFormData) {
      this.openConfirmationModal({
        title: 'Use Template',
        message: `Are you sure you want to use the "${template.name}" template?\n\nThis will overwrite the current form data.`,
        confirmText: 'Yes, Use Template',
        cancelText: 'Cancel',
        confirmButtonClass: 'bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors',
        onConfirm: () => {
          this.applyTemplate(template);
          this.closeConfirmationModal();
        }
      });
    } else {
      this.applyTemplate(template);
    }
    
    this.showTemplateDropdown = false;
  }
  
  // ✅ Separate method to apply template
  private applyTemplate(template: PrescriptionTemplate): void {
    this.prescriptionForm.patchValue({
      medication: template.medication,
      dosage: template.dosage,
      form: template.form,
      instructions: template.instructions,
      quantity: template.quantity,
      refills: template.refills
    });
    this.showSuccessMessage(`Template "${template.name}" applied successfully`);
  }
  
  // ✅ Save template with confirmation
  saveAsTemplate(): void {
    if (this.prescriptionForm.invalid || !this.prescriptionForm.value.medication) {
      this.showErrorMessage('Please fill in the medication details before saving as template');
      return;
    }
    
    const medicationName = this.prescriptionForm.value.medication;
    
    this.openConfirmationModal({
      title: 'Save as Template',
      message: `Do you want to save this prescription as a template?\n\nTemplate name: "${medicationName} - Template"\n\nThis will make it available for future use.`,
      confirmText: 'Save Template',
      cancelText: 'Cancel',
      confirmButtonClass: 'bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors',
      onConfirm: () => {
        this.performSaveTemplate();
      }
    });
  }
  
  // ✅ Perform template save
  private performSaveTemplate(): void {
    try {
      const formValue = this.prescriptionForm.value;
      const templateName = `${formValue.medication} - Custom Template`;
      
      const templateData = {
        name: templateName,
        medication: formValue.medication,
        dosage: formValue.dosage,
        form: formValue.form,
        instructions: formValue.instructions,
        quantity: formValue.quantity,
        refills: formValue.refills,
        is_public: false
      };

      this.templateService.saveTemplate(templateData).subscribe(
        savedTemplate => {
          this.closeConfirmationModal();
          this.showSuccessMessage(`Template "${savedTemplate.name}" saved successfully!`);
          this.loadTemplates(); // Refresh templates list
        },
        error => {
          console.error('Error saving template:', error);
          this.closeConfirmationModal();
          this.showErrorMessage('Error saving template. Please try again.');
        }
      );
        
    } catch (error) {
      console.error('Error saving template:', error);
      this.closeConfirmationModal();
      this.showErrorMessage('Error saving template. Please try again.');
    }
  }
  
  // ✅ Save draft with confirmation if form is empty
  saveDraft(): void {
    if (!this.validateDoctorAuthentication()) {
      return;
    }

    if (this.prescriptionForm.invalid) {
      this.markFormGroupTouched(this.prescriptionForm);
      this.showErrorMessage('Please fill in the required fields before saving as draft');
      return;
    }
    
    const prescriptionData = this.getPrescriptionData('draft');
    
    this.openConfirmationModal({
      title: 'Save Draft',
      message: `Save this prescription as a draft?\n\nMedication: ${prescriptionData.medication}\nDosage: ${prescriptionData.dosage}\n\nYou can continue editing it later.`,
      confirmText: 'Save Draft',
      cancelText: 'Cancel',
      confirmButtonClass: 'bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition-colors',
      onConfirm: async () => {
        await this.createDraftPrescription(prescriptionData);
      }
    });
  }

  private async createDraftPrescription(prescriptionData: Prescription): Promise<void> {
    if (!this.patientId) {
      this.closeConfirmationModal();
      this.showErrorMessage('Patient ID is required');
      return;
    }

    try {
      console.log('=== SAVING DRAFT ===');
      
      const medicationData = PrescriptionMedicationAdapter.prescriptionToMedication(
        prescriptionData, 
        this.patientId,
        this.authService
      );
      
      const result = await this.medicationService.addMedication(medicationData);
      
      const savedPrescription = PrescriptionMedicationAdapter.medicationToPrescription(
        result.data || result,
        this.authService
      );
      
      this.prescriptionCreated.emit(savedPrescription);
      this.closeConfirmationModal();
      this.showSuccessMessage('Prescription saved as draft');
      
    } catch (error) {
      console.error('Error saving draft:', error);
      this.closeConfirmationModal();
      this.showErrorMessage('Error saving draft. Please try again.');
    }
  }
  
  // ✅ Sign and issue with confirmation - handles both create and update
  signAndIssue(): void {
    if (!this.validateDoctorAuthentication()) {
      return;
    }
    
    if (this.prescriptionForm.invalid) {
      this.markFormGroupTouched(this.prescriptionForm);
      this.showErrorMessage('Please fill in all required fields before signing');
      return;
    }
    
    if (this.isEditing) {
      this.updateExistingPrescription();
    } else {
      this.createNewPrescription();
    }
  }

  // ✅ Update existing prescription method
  private updateExistingPrescription(): void {
    const prescriptionData = this.getPrescriptionData('active');
    
    // Keep the original ID for updating
    if (this.prescriptionToEdit) {
      prescriptionData.id = this.prescriptionToEdit.id;
    }
    
    this.openConfirmationModal({
      title: 'Update Prescription',
      message: `Are you sure you want to update this prescription?\n\nMedication: ${prescriptionData.medication}\nDosage: ${prescriptionData.dosage}\nInstructions: ${prescriptionData.instructions}`,
      confirmText: 'Update Prescription',
      cancelText: 'Cancel',
      confirmButtonClass: 'px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors',
      onConfirm: () => this.processUpdate(prescriptionData)
    });
  }

  // ✅ Process the update
  private async processUpdate(prescriptionData: Prescription): Promise<void> {
    this.confirmationModal.isProcessing = true;
    
    try {
      console.log('Updating prescription:', prescriptionData);
      
      // For now, just emit the updated prescription
      // In a real app, you'd call an API to update
      this.prescriptionUpdated.emit(prescriptionData);
      
      this.closeConfirmationModal();
      this.showSuccessMessage('Prescription updated successfully!');
      
    } catch (error: any) {
      console.error('Error updating prescription:', error);
      this.showErrorMessage(error.message || 'Failed to update prescription');
      this.confirmationModal.isProcessing = false;
    }
  }

  // ✅ Create new prescription method
  private createNewPrescription(): void {
    const prescriptionData = this.getPrescriptionData('active');
    
    this.openConfirmationModal({
      title: 'Sign & Issue Prescription',
      message: `Are you sure you want to sign and issue this prescription?\n\nMedication: ${prescriptionData.medication}\nDosage: ${prescriptionData.dosage}\nInstructions: ${prescriptionData.instructions}`,
      confirmText: 'Sign & Issue',
      cancelText: 'Cancel',
      confirmButtonClass: 'px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors',
      onConfirm: () => this.processSignAndIssue(prescriptionData)
    });
  }

  // ✅ Process sign and issue
  private async processSignAndIssue(prescriptionData: Prescription): Promise<void> {
    this.confirmationModal.isProcessing = true;
    
    try {
      console.log('Creating new prescription:', prescriptionData);
      
      // Convert to Medication format for API
      const medicationData = PrescriptionMedicationAdapter.prescriptionToMedication(
        prescriptionData,
        this.patientId || 0,
        this.authService
      );
      
      // Create via API
      const result = await this.medicationService.addMedication(medicationData);
      
      // Convert back to prescription format
      const savedPrescription = PrescriptionMedicationAdapter.medicationToPrescription(
        result.data || result,
        this.authService
      );
      
      // Emit success
      this.prescriptionCreated.emit(savedPrescription);
      
      this.closeConfirmationModal();
      this.resetForm();
      
    } catch (error: any) {
      console.error('Error creating prescription:', error);
      this.showErrorMessage(error.message || 'Failed to create prescription');
      this.confirmationModal.isProcessing = false;
    }
  }

  // ✅ Validate doctor authentication
  private validateDoctorAuthentication(): boolean {
    const currentUser = this.authService.currentUserValue;
    
    if (!currentUser || !currentUser.id) {
      this.showErrorMessage('Authentication error: No doctor logged in. Please log in again.');
      return false;
    }
    
    return true;
  }
  
  // ✅ Cancel with confirmation if form has data
  cancel(): void {
    const hasUnsavedData = this.prescriptionForm.dirty || 
                          this.prescriptionForm.get('medication')?.value ||
                          this.prescriptionForm.get('dosage')?.value;
    
    if (hasUnsavedData) {
      this.openConfirmationModal({
        title: 'Cancel Prescription',
        message: 'Are you sure you want to cancel?\n\nAll unsaved changes will be lost.',
        confirmText: 'Yes, Cancel',
        cancelText: 'Continue Editing',
        confirmButtonClass: 'bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors',
        onConfirm: () => {
          this.performCancel();
        }
      });
    } else {
      this.performCancel();
    }
  }
  
  // ✅ Perform cancel action
  private performCancel(): void {
    this.resetForm();
    this.closeConfirmationModal();
    this.cancelled.emit();
  }
  
  // ✅ Get current doctor name
  getCurrentDoctorName(): string {
    const currentUser = this.authService.currentUserValue;
    
    if (!currentUser) {
      return 'Not logged in';
    }
        
    if (currentUser.name) {
      return `Prescribing as: Dr. ${currentUser.name}`;
    }
    
    return `Prescribing as: Doctor (ID: ${currentUser.id})`;
  }

  // ✅ Reset form (single version)
  resetForm(): void {
    this.prescriptionForm.reset({
      form: 'tablet',
      quantity: 30,
      refills: 0,
      sendToPharmacy: false,
      startDate: this.getCurrentDate()
    });
    this.showTemplateDropdown = false;
    this.isEditing = false;
    this.prescriptionToEdit = null;
  }
  
  // ✅ Success message system
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
  
  // ✅ Error message system
  private showErrorMessage(message: string): void {
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
    setTimeout(() => notification.classList.remove('translate-x-full'), 100);
    setTimeout(() => {
      notification.classList.add('translate-x-full');
      setTimeout(() => document.body.removeChild(notification), 300);
    }, 4000);
  }
  
  private getPrescriptionData(status: 'draft' | 'active'): Prescription {
    const formValue = this.prescriptionForm.value;
    return {
      id: this.prescriptionToEdit?.id, // Include ID for updates
      patientId: this.patientId || 0,
      medication: formValue.medication,
      dosage: formValue.dosage,
      form: formValue.form,
      instructions: formValue.instructions,
      quantity: formValue.quantity,
      refills: formValue.refills,
      startDate: formValue.startDate,
      endDate: formValue.endDate,
      status: status,
      prescribedBy: '', // Will be set by adapter
      prescribedDate: new Date().toISOString(),
      sendToPharmacy: formValue.sendToPharmacy,
      pharmacistNotes: formValue.pharmacistNotes
    };
  }
  
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if ((control as any).controls) {
        this.markFormGroupTouched(control as FormGroup);
      }
    });
  }
  
  // ✅ NEW: Load templates from service
  private loadTemplates(): void {
    this.templateService.getTemplates().subscribe(
      templates => {
        this.templates = templates;
        console.log('Loaded templates:', templates);
      },
      error => {
        console.error('Error loading templates:', error);
        this.templates = [];
      }
    );
  }
}