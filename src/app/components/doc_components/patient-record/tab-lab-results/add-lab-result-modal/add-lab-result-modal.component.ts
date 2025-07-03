import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { LabResult, CreateLabResultRequest, LabTestTemplate, LabParameter } from '../../../../../models/lab-result.model';
import { LabResultService } from '../../../../../services/doc-services/lab-result.service';

@Component({
  selector: 'app-add-lab-result-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-lab-result-modal.component.html',
  styleUrls: ['./add-lab-result-modal.component.css'],
})
export class AddLabResultModalComponent implements OnInit {
  @Input() patientId!: number;
  
  @Output() labResultAdded = new EventEmitter<LabResult>();
  @Output() cancelled = new EventEmitter<void>();

  labResultForm!: FormGroup;
  labTestTemplates: LabTestTemplate[] = [];
  selectedTemplate: LabTestTemplate | null = null;
  isSubmitting = false;
  submitError = '';

  constructor(
    private fb: FormBuilder,
    private labResultService: LabResultService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadLabTestTemplates();
  }

  private initializeForm(): void {
    // Get today's date in YYYY-MM-DD format
    const today = new Date();
    const todayString = today.getFullYear() + '-' + 
                       String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                       String(today.getDate()).padStart(2, '0');

    this.labResultForm = this.fb.group({
      test_name: ['', [Validators.required]],
      result_date: [todayString, [Validators.required]],
      performed_by_lab_name: [''],
      interpretation: [''],
      status: ['completed', [Validators.required]],
      parameters: this.fb.array([])
    });
  }

  private loadLabTestTemplates(): void {
    this.labResultService.getLabTestTemplates().subscribe({
      next: (templates) => {
        this.labTestTemplates = templates;
      },
      error: (error) => {
        console.error('Failed to load lab test templates:', error);
      }
    });
  }

  get parametersArray(): FormArray {
    return this.labResultForm.get('parameters') as FormArray;
  }

  onTemplateSelect(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const templateId = select.value;
    
    if (templateId) {
      const template = this.labTestTemplates.find(t => t.id === templateId);
      if (template) {
        this.selectedTemplate = template;
        this.labResultForm.patchValue({ test_name: template.name });
        this.setupParametersFromTemplate(template);
      }
    } else {
      this.selectedTemplate = null;
      this.clearParameters();
    }
  }

  private setupParametersFromTemplate(template: LabTestTemplate): void {
    this.clearParameters();
    
    template.parameters.forEach(param => {
      this.addParameter({
        name: param.name,
        unit: param.unit,
        reference_range: param.reference_range,
        value: '',
        status: 'normal'
      });
    });
  }

  private clearParameters(): void {
    while (this.parametersArray.length !== 0) {
      this.parametersArray.removeAt(0);
    }
  }

  addParameter(param?: Partial<LabParameter>): void {
    const paramGroup = this.fb.group({
      name: [param?.name || '', [Validators.required]],
      value: [param?.value || '', [Validators.required]],
      unit: [param?.unit || ''],
      reference_range: [param?.reference_range || ''],
      status: [param?.status || 'normal', [Validators.required]]
    });

    this.parametersArray.push(paramGroup);
  }

  removeParameter(index: number): void {
    this.parametersArray.removeAt(index);
  }

  onSubmit(): void {
    if (this.labResultForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      this.submitError = '';

      const formValue = this.labResultForm.value;
      
      // Validate that we have at least one parameter
      if (!formValue.parameters || formValue.parameters.length === 0) {
        this.submitError = 'Please add at least one parameter to the lab result.';
        this.isSubmitting = false;
        return;
      }

      // Format the request according to backend expectations
      const labResultRequest: CreateLabResultRequest = {
        patient_id: this.patientId,
        test_name: formValue.test_name,
        result_date: formValue.result_date,
        performed_by_lab_name: formValue.performed_by_lab_name || undefined,
        structured_results: {
          results: formValue.parameters.map((param: any) => ({
            parameter: param.name,  // Backend expects 'parameter' field
            name: param.name,       // Also include 'name' for frontend compatibility
            value: param.value.toString(),
            unit: param.unit || '',
            reference_range: param.reference_range || '',
            status: param.status
          }))
        },
        interpretation: formValue.interpretation || undefined,
        status: formValue.status
      };

      console.log('Sending lab result request:', labResultRequest);

      this.labResultService.createLabResult(labResultRequest).subscribe({
        next: (result) => {
          this.labResultAdded.emit(result);
          this.isSubmitting = false;
        },
        error: (error) => {
          console.error('Error creating lab result:', error);
          this.submitError = error.message || 'Failed to create lab result. Please check your data and try again.';
          this.isSubmitting = false;
        }
      });
    } else {
      // Mark all fields as touched to show validation errors
      this.markFormGroupTouched(this.labResultForm);
      this.submitError = 'Please fill in all required fields correctly.';
    }
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(field => {
      const control = formGroup.get(field);
      control?.markAsTouched({ onlySelf: true });
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  getStatusOptions() {
    return [
      { value: 'completed', label: 'Completed' },
      { value: 'pending', label: 'Pending' },
      { value: 'in_progress', label: 'In Progress' }
    ];
  }

  getParameterStatusOptions() {
    return [
      { value: 'normal', label: 'Normal' },
      { value: 'high', label: 'High' },
      { value: 'low', label: 'Low' },
      { value: 'borderline', label: 'Borderline' },
      { value: 'critical', label: 'Critical' }
    ];
  }
}