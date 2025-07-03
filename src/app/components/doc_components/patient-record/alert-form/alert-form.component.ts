import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Alert } from '../../../../models/alert.model';
import { AlertService, AlertRequest } from '../../../../services/doc-services/alert.service';

@Component({
  selector: 'app-alert-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './alert-form.component.html'
})
export class AlertFormComponent implements OnInit {
  @Input() alert: Alert | null = null;
  @Input() patientId: number | null = null;
  @Input() isEdit = false;
  @Output() save = new EventEmitter<Alert>();
  @Output() cancel = new EventEmitter<void>();

  formData: Partial<Alert> = {
    type: 'warning',
    severity: 'medium',
    title: '',
    description: '',
    isActive: true
  };

  severityOptions: Array<{ value: string; label: string; color: string }> = [];
  alertTypeOptions: Array<{ value: string; label: string; icon: string }> = [];
  isLoading = false;
  errors: { [key: string]: string } = {};

  constructor(private alertService: AlertService) {}

  ngOnInit() {
    this.severityOptions = [
      { value: 'critical', label: 'Critical', color: 'text-red-600' },
      { value: 'high', label: 'High', color: 'text-amber-600' },
      { value: 'medium', label: 'Medium', color: 'text-yellow-600' },
      { value: 'low', label: 'Low', color: 'text-blue-600' }
    ];
    
    this.alertTypeOptions = [
      { value: 'allergy', label: 'Allergy', icon: '🚫' },
      { value: 'medication', label: 'Medication', icon: '💊' },
      { value: 'condition', label: 'Condition', icon: '🏥' },
      { value: 'warning', label: 'Warning', icon: '⚠️' },
      { value: 'general', label: 'General', icon: 'ℹ️' }
    ];

    if (this.alert && this.isEdit) {
      this.formData = {
        type: this.alert.type,
        severity: this.alert.severity,
        title: this.alert.title,
        description: this.alert.description,
        isActive: this.alert.isActive
      };
    }
  }

  validateForm(): boolean {
    this.errors = {};
    let isValid = true;

    if (!this.formData.title?.trim()) {
      this.errors['title'] = 'Title is required';
      isValid = false;
    }

    if (!this.formData.description?.trim()) {
      this.errors['description'] = 'Description is required';
      isValid = false;
    }

    if (!this.formData.type) {
      this.errors['type'] = 'Alert type is required';
      isValid = false;
    }

    if (!this.formData.severity) {
      this.errors['severity'] = 'Severity is required';
      isValid = false;
    }

    return isValid;
  }

  onSubmit() {
    if (!this.validateForm()) {
      return;
    }

    if (!this.patientId) {
      this.errors['general'] = 'Patient ID is required';
      return;
    }

    this.isLoading = true;
    this.errors = {};

    if (this.isEdit && this.alert?.id) {
      // Update existing alert
      const updateData: Partial<AlertRequest> = {
        type: this.formData.type!,
        severity: this.formData.severity!,
        title: this.formData.title!,
        description: this.formData.description,
        is_active: this.formData.isActive
      };

      this.alertService.updateAlert(Number(this.alert.id), updateData).subscribe({
        next: (updatedAlert: any) => {
          this.isLoading = false;
          this.save.emit(updatedAlert);
        },
        error: (error: any) => {
          this.isLoading = false;
          this.handleError(error);
        }
      });
    } else {
      // Create new alert
      const createData: AlertRequest = {
        patient_id: this.patientId!,
        type: this.formData.type!,
        severity: this.formData.severity!,
        title: this.formData.title!,
        description: this.formData.description || '',
        is_active: this.formData.isActive ?? true
      };

      this.alertService.createAlert(createData).subscribe({
        next: (newAlert: any) => {
          this.isLoading = false;
          this.save.emit(newAlert);
        },
        error: (error: any) => {
          this.isLoading = false;
          this.handleError(error);
        }
      });
    }
  }

  private handleError(error: any) {
    if (error.error?.errors) {
      // Laravel validation errors
      const validationErrors = error.error.errors;
      for (const field in validationErrors) {
        if (validationErrors[field] && validationErrors[field].length > 0) {
          this.errors[field] = validationErrors[field][0];
        }
      }
    } else if (error.error?.message) {
      this.errors['general'] = error.error.message;
    } else {
      this.errors['general'] = 'An error occurred while saving the alert';
    }
  }

  onCancel() {
    this.cancel.emit();
  }

  getSeverityColor(severity: string): string {
    const option = this.severityOptions.find(opt => opt.value === severity);
    return option?.color || 'text-gray-600';
  }

  getAlertTypeIcon(type: string): string {
    const option = this.alertTypeOptions.find(opt => opt.value === type);
    return option?.icon || 'bell';
  }
}
