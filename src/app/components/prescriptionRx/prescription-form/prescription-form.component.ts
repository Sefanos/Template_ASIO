import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Prescription, PrescriptionTemplate } from '../../../models/prescription.model';
import { PatientService } from '../../../services/patient.service';

@Component({
  selector: 'app-prescription-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './prescription-form.component.html',
  styleUrl: './prescription-form.component.css'
})
export class PrescriptionFormComponent implements OnInit {
  @Input() patientId: number | null = null;
  @Input() prescriptionToEdit: Prescription | null = null;
  @Output() prescriptionCreated = new EventEmitter<Prescription>();
  @Output() prescriptionUpdated = new EventEmitter<Prescription>();
  @Output() cancelled = new EventEmitter<void>();

  prescriptionForm: FormGroup;
  showTemplateDropdown = false;
  isEditing = false;
  
  // Sample template data - in a real app this would come from a service
  templates: PrescriptionTemplate[] = [
    {
      id: 1,
      name: 'Amoxicillin - Respiratory Infection',
      medication: 'Amoxicillin',
      dosage: '500mg',
      form: 'capsule',
      instructions: 'Take one capsule by mouth three times a day for 10 days',
      quantity: 30,
      refills: 0
    },
    {
      id: 2,
      name: 'Lisinopril - Hypertension',
      medication: 'Lisinopril',
      dosage: '10mg',
      form: 'tablet',
      instructions: 'Take one tablet by mouth daily',
      quantity: 30,
      refills: 3
    },
    {
      id: 3,
      name: 'Metformin - Diabetes',
      medication: 'Metformin',
      dosage: '500mg',
      form: 'tablet',
      instructions: 'Take one tablet by mouth twice daily with meals',
      quantity: 60,
      refills: 3
    }
  ];
  
  constructor(
    private fb: FormBuilder,
    private patientService: PatientService
  ) {
    this.prescriptionForm = this.createForm();
  }
  
  ngOnInit(): void {
    if (this.prescriptionToEdit) {
      this.isEditing = true;
      this.prescriptionForm.patchValue({
        medication: this.prescriptionToEdit.medication,
        dosage: this.prescriptionToEdit.dosage,
        form: this.prescriptionToEdit.form,
        instructions: this.prescriptionToEdit.instructions,
        quantity: this.prescriptionToEdit.quantity,
        refills: this.prescriptionToEdit.refills,
        startDate: this.prescriptionToEdit.startDate,
        endDate: this.prescriptionToEdit.endDate || '',
        sendToPharmacy: this.prescriptionToEdit.sendToPharmacy,
        pharmacistNotes: this.prescriptionToEdit.pharmacistNotes || ''
      });
    }
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
    return now.toISOString().split('T')[0]; // Format as YYYY-MM-DD
  }
  
  toggleTemplateDropdown(): void {
    this.showTemplateDropdown = !this.showTemplateDropdown;
  }
  
  useTemplate(template: PrescriptionTemplate): void {
    this.prescriptionForm.patchValue({
      medication: template.medication,
      dosage: template.dosage,
      form: template.form,
      instructions: template.instructions,
      quantity: template.quantity,
      refills: template.refills
    });
    this.showTemplateDropdown = false;
  }
  
  saveAsTemplate(): void {
    // In a real app, this would call a service to save the template
    console.log('Saving template:', this.prescriptionForm.value);
    alert('Template saved successfully');
  }
  
  saveDraft(): void {
    if (this.prescriptionForm.invalid) {
      this.markFormGroupTouched(this.prescriptionForm);
      return;
    }
    
    const prescriptionData = this.getPrescriptionData('draft');
    
    if (this.isEditing && this.prescriptionToEdit && this.prescriptionToEdit.id) {
      // Update existing prescription
      const updatedPrescription = {
        ...prescriptionData,
        id: this.prescriptionToEdit.id,
        prescribedDate: this.prescriptionToEdit.prescribedDate
      };
      
      this.patientService.updatePrescription(updatedPrescription).subscribe({
        next: (result) => {
          console.log('Prescription updated as draft:', result);
          this.prescriptionUpdated.emit(result);
          alert('Prescription saved as draft');
        },
        error: (error) => {
          console.error('Error updating prescription:', error);
          alert('Error saving prescription draft');
        }
      });
    } else {
      // Create new draft prescription
      this.patientService.addPrescription(prescriptionData).subscribe({
        next: (result) => {
          console.log('New prescription draft created:', result);
          this.prescriptionCreated.emit(result);
          alert('Prescription saved as draft');
        },
        error: (error) => {
          console.error('Error creating prescription draft:', error);
          alert('Error saving prescription draft');
        }
      });
    }
  }
  
  signAndIssue(): void {
    if (this.prescriptionForm.invalid) {
      this.markFormGroupTouched(this.prescriptionForm);
      return;
    }
    
    const prescriptionData = this.getPrescriptionData('active');
    
    if (this.isEditing && this.prescriptionToEdit && this.prescriptionToEdit.id) {
      // Update existing prescription
      const updatedPrescription = {
        ...prescriptionData,
        id: this.prescriptionToEdit.id,
        prescribedDate: this.prescriptionToEdit.prescribedDate
      };
      
      this.patientService.updatePrescription(updatedPrescription).subscribe({
        next: (result) => {
          console.log('Prescription updated and issued:', result);
          this.prescriptionUpdated.emit(result);
          alert('Prescription signed and issued successfully');
        },
        error: (error) => {
          console.error('Error updating prescription:', error);
          alert('Error signing and issuing prescription');
        }
      });
    } else {
      // Create new active prescription
      this.patientService.addPrescription(prescriptionData).subscribe({
        next: (result) => {
          console.log('New prescription created and issued:', result);
          this.prescriptionCreated.emit(result);
          alert('Prescription signed and issued successfully');
        },
        error: (error) => {
          console.error('Error creating prescription:', error);
          alert('Error signing and issuing prescription');
        }
      });
    }
  }
  
  cancel(): void {
    this.cancelled.emit();
  }
  
  private getPrescriptionData(status: 'draft' | 'active'): Prescription {
    const formValue = this.prescriptionForm.value;
    return {
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
      prescribedBy: 'Dr. Sefanos B.', // In a real app, this would come from auth service
      prescribedDate: new Date().toISOString(),
      sendToPharmacy: formValue.sendToPharmacy,
      pharmacistNotes: formValue.pharmacistNotes
    };
  }
  
  // Helper method to mark all form controls as touched to trigger validation messages
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if ((control as any).controls) {
        this.markFormGroupTouched(control as FormGroup);
      }
    });
  }
}
