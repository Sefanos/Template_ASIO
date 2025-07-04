import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { isRoleObject } from '../../../models/role-utils';
import { Role } from '../../../models/role.model';
import { User, UserCreationDto } from '../../../models/user.model';
import { UserService } from '../../../services/admin-service/user.service';

@Component({
  selector: 'app-user-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-page.component.html'
})
export class UserPageComponent implements OnInit {
  userId: number | null = null;
  isNewUser = false;
  userForm: FormGroup;
  roles: Role[] = [];
  statuses: string[] = [];
  showPassword = false;
  showConfirmPassword = false;
  formSubmitted = false;
  loading = false;
  errorMessage: string | null = null;
  validationErrors: { [key: string]: string[] } = {};
  
  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService
  ) {
    this.userForm = this.createForm();
  }
  
  ngOnInit(): void {
    this.loading = true;
    
    // Load available roles and statuses
    this.userService.getRoles().subscribe({
      next: (roles) => {
        this.roles = roles;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading roles:', error);
        this.roles = [];
        this.loading = false;
        this.errorMessage = 'Failed to load roles. Please try again.';
      }
    });
    
    this.userService.getStatuses().subscribe({
      next: (statuses) => {
        this.statuses = statuses;
      },
      error: (error) => {
        console.error('Error loading statuses:', error);
        this.statuses = ['active', 'pending', 'inactive']; 
      }
    });
    
    // Get user ID from route params
    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');
      if (idParam === 'new') {
        this.isNewUser = true;
        this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(8)]);
        this.userForm.get('confirmPassword')?.setValidators([Validators.required, Validators.minLength(8)]);
        this.userForm.updateValueAndValidity();
        this.loading = false;
      } else if (idParam) {
        this.userId = +idParam;
        this.loadUserData(+idParam);
      } else {
        this.returnToUsersList();
      }
    });
  }
  
  private createForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      role: ['', [Validators.required]],
      status: ['active', [Validators.required]],
      phoneNumber: [''],
      password: [''],
      confirmPassword: [''],
      changePassword: [false],
      forceChange: [true]
    }, {
      validators: this.passwordMatchValidator
    });
  }
  
  private passwordMatchValidator(fg: FormGroup) {
    const changePassword = fg.get('changePassword')?.value;
    const password = fg.get('password')?.value;
    const confirmPassword = fg.get('confirmPassword')?.value;
    
    if ((changePassword || fg.get('password')?.hasValidator(Validators.required)) && 
         password !== confirmPassword) {
      fg.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    } else {
      return null;
    }
  }
  
  loadUserData(userId: number): void {
    this.loading = true;
    this.userService.getUser(userId).subscribe({
      next: (user) => {
        if (user) {
          let selectedRoleId = '';
          if (user.roles && user.roles.length > 0) {
            const firstRole = user.roles[0];
            selectedRoleId = isRoleObject(firstRole) ? firstRole.id.toString() : firstRole.toString();
          }
          
          this.userForm.patchValue({
            name: user.name || '',
            email: user.email,
            role: selectedRoleId,
            status: user.status || 'active',
            phoneNumber: user.phone || user.phoneNumber || '',
            changePassword: false,
            forceChange: true
          });
        } else {
          this.returnToUsersList();
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading user:', error);
        this.errorMessage = 'Failed to load user data. Please try again.';
        this.loading = false;
      }
    });
  }
  
  onSubmit(): void {
    this.formSubmitted = true;
    this.errorMessage = null;
    this.validationErrors = {};
    
    if (this.userForm.invalid) {
      return;
    }
    
    const formValues = this.userForm.value;
    this.loading = true;
    
    if (this.isNewUser) {
      const newUserData: UserCreationDto = {
        name: formValues.name,
        email: formValues.email,
        roles: [parseInt(formValues.role)],
        status: formValues.status,
        phone: formValues.phoneNumber,
        password: formValues.password,
        password_confirmation: formValues.confirmPassword
      };
      
      this.userService.addUser(newUserData).subscribe({
        next: (user) => {
          if (formValues.role) {
            this.userService.assignRoles(user.id, [parseInt(formValues.role)]).subscribe({
              next: () => {
                this.returnToUsersList();
              },
              error: (roleError) => {
                console.error('Error assigning role to new user:', roleError);
                this.returnToUsersList();
              }
            });
          } else {
            this.returnToUsersList();
          }
        },
        error: (error) => {
          console.error('Error creating user:', error);
          this.loading = false;
          
          if (error.error && error.error.errors) {
            this.validationErrors = error.error.errors;
            this.errorMessage = error.error.message || 'Failed to create user. Please check the form for errors.';
          } else {
            this.errorMessage = 'Failed to create user. Please try again.';
          }
        }
      });
    } else {
      const userData: User = {
        id: this.userId || 0,
        name: formValues.name,
        email: formValues.email,
        roles: [],
        status: formValues.status,
        phone: formValues.phoneNumber
      };
      
      this.userService.updateUser(userData).subscribe({
        next: (updatedUser) => {
          if (formValues.role) {
            this.userService.assignRoles(this.userId as number, [parseInt(formValues.role)]).subscribe({
              next: () => {
                if (formValues.changePassword && formValues.password) {
                  this.resetUserPassword(this.userId as number, formValues.password, formValues.forceChange);
                } else {
                  this.loading = false;
                  this.returnToUsersList();
                }
              },
              error: (roleError) => {
                console.error('Error assigning role:', roleError);
                this.loading = false;
                
                if (formValues.changePassword && formValues.password) {
                  this.resetUserPassword(this.userId as number, formValues.password, formValues.forceChange);
                } else {
                  this.returnToUsersList();
                }
              }
            });
          } else {
            if (formValues.changePassword && formValues.password) {
              this.resetUserPassword(this.userId as number, formValues.password, formValues.forceChange);
            } else {
              this.loading = false;
              this.returnToUsersList();
            }
          }
        },
        error: (error) => {
          console.error('Error updating user:', error);
          this.loading = false;
          
          if (error.error && error.error.errors) {
            this.validationErrors = error.error.errors;
            this.errorMessage = error.error.message || 'Failed to update user. Please check the form for errors.';
          } else {
            this.errorMessage = 'Failed to update user. Please try again.';
          }
        }
      });
    }
  }

  resetUserPassword(userId: number, password: string, forceChange: boolean): void {
    this.userService.resetUserPassword(userId, {
      password: password,
      force_change: forceChange
    }).subscribe({
      next: (response) => {
        this.loading = false;
        this.returnToUsersList();
      },
      error: (error) => {
        console.error('Error resetting password:', error);
        this.loading = false;
        
        if (error.error && error.error.errors) {
          this.validationErrors = error.error.errors;
          this.errorMessage = error.error.message || 'Failed to reset password. Please check the form for errors.';
        } else {
          this.errorMessage = 'Failed to reset password. Please try again.';
        }
      }
    });
  }
  
  onChangePasswordToggle(): void {
    const changePassword = this.userForm.get('changePassword')?.value;
    
    if (changePassword) {
      this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(8)]);
      this.userForm.get('confirmPassword')?.setValidators([Validators.required, Validators.minLength(8)]);
    } else {
      this.userForm.get('password')?.clearValidators();
      this.userForm.get('confirmPassword')?.clearValidators();
      this.userForm.get('password')?.setValue('');
      this.userForm.get('confirmPassword')?.setValue('');
    }
    
    this.userForm.get('password')?.updateValueAndValidity();
    this.userForm.get('confirmPassword')?.updateValueAndValidity();
  }
  
  togglePasswordVisibility(field: 'password' | 'confirmPassword'): void {
    if (field === 'password') {
      this.showPassword = !this.showPassword;
    } else {
      this.showConfirmPassword = !this.showConfirmPassword;
    }
  }
  
  private returnToUsersList(): void {
    this.route.queryParams.subscribe(params => {
      const returnPage = params['returnPage'] || 1;
      const sortBy = params['sortBy'] || 'created_at';
      const sortDirection = params['sortDirection'] || 'desc';
      
      this.router.navigate(['/admin/users'], {
        queryParams: {
          page: returnPage,
          sort_by: sortBy,
          sort_direction: sortDirection
        }
      });
    }).unsubscribe();
  }

  cancel(): void {
    this.returnToUsersList();
  }
  
  hasError(fieldName: string): boolean {
    return this.formSubmitted && 
           ((!!this.userForm.get(fieldName)?.errors) || 
           (!!this.validationErrors[fieldName]));
  }
  
  getErrorMessage(fieldName: string): string {
    if (this.validationErrors[fieldName]) {
      return this.validationErrors[fieldName][0];
    }
    
    const field = this.userForm.get(fieldName);
    if (field?.hasError('required')) {
      return 'This field is required';
    } else if (field?.hasError('email')) {
      return 'Please enter a valid email address';
    } else if (field?.hasError('minlength')) {
      return `Minimum length is ${field.getError('minlength').requiredLength} characters`;
    } else if (field?.hasError('passwordMismatch')) {
      return 'Passwords do not match';
    }
    
    return 'Invalid value';
  }
}