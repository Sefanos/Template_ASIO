 
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { PatientService, BackendResponse } from '../../../../../core/patient/services/patient.service';
import { finalize } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';

// Custom Validator for password mismatch
export function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const newPassword = control.get('newPassword');
  const confirmPassword = control.get('confirmPassword');

  if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
    confirmPassword.setErrors({ passwordMismatch: true }); // Set error on confirmPassword control
    return { passwordMismatch: true }; // Return error on form group level as well
  } else if (confirmPassword && confirmPassword.hasError('passwordMismatch')) {
    // Clear mismatch error if passwords now match or newPassword changes
     confirmPassword.setErrors(null);
  }
  return null;
}
@Component({
  selector: 'app-profile-security',
  standalone: false, // Assuming this is part of a module
  templateUrl: './profile-security.component.html',
  styleUrl: './profile-security.component.css'
})
export class ProfileSecurityComponent implements OnInit {
  passwordForm!: FormGroup; // Definite assignment assertion
  isSubmitting = false;
  updateSuccessMessage: string | null = null;
  updateErrorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private patientService: PatientService
  ) { }

  ngOnInit(): void {
    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]], // Backend usually has min length
      confirmPassword: ['', Validators.required]
    }, { validators: passwordMatchValidator });
  }

  onChangePassword(): void {
    this.updateSuccessMessage = null;
    this.updateErrorMessage = null;

    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      // Check specific errors for better user feedback if needed
      if (this.passwordForm.errors?.['passwordMismatch']) {
          this.updateErrorMessage = 'Les nouveaux mots de passe ne correspondent pas.';
      } else {
          this.updateErrorMessage = 'Veuillez corriger les erreurs dans le formulaire.';
      }
      return;
    }

    this.isSubmitting = true;
    const formValue = this.passwordForm.value;
    const payload = {
      current_password: formValue.currentPassword,
      new_password: formValue.newPassword,
      new_password_confirmation: formValue.confirmPassword // Laravel expects this
    };

    this.patientService.changePassword(payload)
      .pipe(finalize(() => this.isSubmitting = false))
      .subscribe({
        next: (response: BackendResponse<null>) => {
          if (response.success) {
            this.updateSuccessMessage = response.message || 'Mot de passe changé avec succès !';
            this.passwordForm.reset();
            // Optionally, clear validators or re-initialize form if reset doesn't clear touched/dirty states as desired
            Object.keys(this.passwordForm.controls).forEach(key => {
                this.passwordForm.get(key)?.setErrors(null) ;
                this.passwordForm.get(key)?.markAsUntouched();
                this.passwordForm.get(key)?.markAsPristine();
            });
            this.passwordForm.setErrors(null);


          } else {
            // Backend indicates failure but not an HTTP error (e.g., validation handled with success:false)
            this.updateErrorMessage = response.message || 'Échec du changement de mot de passe.';
            if (response.errors) {
                const firstErrorKey = Object.keys(response.errors)[0];
                if (response.errors[firstErrorKey] && response.errors[firstErrorKey].length > 0) {
                    this.updateErrorMessage = response.errors[firstErrorKey][0];
                }
            }
          }
        },
        error: (error: HttpErrorResponse) => {
          console.error('Error changing password:', error);
          this.updateErrorMessage = error.error?.message || 'Échec du changement de mot de passe. Veuillez réessayer.';
          if (error.error?.errors) { // Laravel validation errors
            const firstErrorKey = Object.keys(error.error.errors)[0];
            if (error.error.errors[firstErrorKey] && error.error.errors[firstErrorKey].length > 0) {
                this.updateErrorMessage = error.error.errors[firstErrorKey][0];
            }
          }
        }
      });
  }
}