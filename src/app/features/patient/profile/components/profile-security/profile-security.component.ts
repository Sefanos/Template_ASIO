import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { PatientService } from '../../../../../core/patient/services/patient.service'; // Assuming you have a method here
import { finalize } from 'rxjs/operators';

// Custom Validator for password mismatch
export function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const newPassword = control.get('newPassword');
  const confirmPassword = control.get('confirmPassword');

  if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
    return { passwordMismatch: true };
  }
  return null;
}
@Component({
  selector: 'app-profile-security',
  standalone: false,
  templateUrl: './profile-security.component.html',
  styleUrl: './profile-security.component.css'
})

export class ProfileSecurityComponent implements OnInit {
  passwordForm!: FormGroup;
  isSubmitting = false;
  updateSuccessMessage: string | null = null;
  updateErrorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private patientService: PatientService // Or an AuthService if password change is handled there
  ) { }

  ngOnInit(): void {
    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: passwordMatchValidator });
  }
  onChangePassword(): void {
    this.updateSuccessMessage = null;
    this.updateErrorMessage = null;

    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched(); // Mark all fields as touched to show errors
      return;
    }

    this.isSubmitting = true;
    const { currentPassword, newPassword } = this.passwordForm.value;

    // Replace with your actual service call
    this.patientService.changePassword(currentPassword, newPassword)
      .pipe(finalize(() => this.isSubmitting = false))
      .subscribe({
        next: (response: { status: string; message?: string }) => {
          // Assuming response structure like { status: 'success', message: 'Password updated' }
          if (response && response.status === 'success') {
            this.updateSuccessMessage = response.message || 'Mot de passe changé avec succès !';
            this.passwordForm.reset();
          } else {
            this.updateErrorMessage = response.message || 'Une erreur est survenue lors du changement de mot de passe.';
          }
        },
        error: (error: any) => {
          console.error('Error changing password:', error);
          this.updateErrorMessage = error.error?.message || 'Échec du changement de mot de passe. Veuillez réessayer.';
        }
      });
  }

}
