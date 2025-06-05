import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';

export interface ConfirmationDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  needsReason?: boolean;
  reasonLabel?: string;
  reasonPlaceholder?: string;
}

export interface ConfirmationDialogResult {
  confirmed: boolean;
  reason?: string;
}

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule
  ],template: `
    <div class="modern-dialog">
      <div class="dialog-header">
        <div class="icon-container">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="#ef4444"/>
          </svg>
        </div>
        <h3 class="dialog-title">{{ data.title }}</h3>
      </div>
      
      <div class="dialog-body">
        <p class="dialog-message">{{ data.message }}</p>
        
        <div *ngIf="data.needsReason" class="reason-section">
          <label class="reason-label">{{ data.reasonLabel || 'Cancellation Reason' }}</label>
          <textarea 
            [(ngModel)]="reason"
            [placeholder]="data.reasonPlaceholder || 'Please provide a reason...'"
            class="reason-input"
            rows="3">
          </textarea>
        </div>
      </div>
      
      <div class="dialog-footer">        <button 
          type="button"
          (click)="onCancel()"
          [disabled]="isProcessing"
          class="btn btn-secondary">
          {{ data.cancelText || 'Keep Appointment' }}
        </button>
        <button 
          type="button"
          (click)="onConfirm()"
          [disabled]="(data.needsReason && !reason.trim()) || isProcessing"
          class="btn btn-danger">
          <div class="btn-content" [class.loading]="isProcessing">
            <span *ngIf="!isProcessing">{{ data.confirmText || 'Cancel Appointment' }}</span>
            <div *ngIf="isProcessing" class="loading-spinner">
              <div class="spinner"></div>
              <span>Processing...</span>
            </div>
          </div>
        </button>
      </div>
    </div>
  `,  styles: [`
    .modern-dialog {
      width: 480px;
      max-width: 90vw;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }
    
    .dialog-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 24px 24px 16px 24px;
      border-bottom: 1px solid #f3f4f6;
    }
    
    .icon-container {
      width: 40px;
      height: 40px;
      background: #fef2f2;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .dialog-title {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #111827;
    }
    
    .dialog-body {
      padding: 16px 24px 24px 24px;
    }
    
    .dialog-message {
      color: #4b5563;
      line-height: 1.6;
      margin: 0 0 20px 0;
      white-space: pre-line;
    }
    
    .reason-section {
      margin-top: 20px;
    }
    
    .reason-label {
      display: block;
      font-size: 14px;
      font-weight: 500;
      color: #374151;
      margin-bottom: 8px;
    }
    
    .reason-input {
      width: 100%;
      padding: 12px;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      font-size: 14px;
      resize: vertical;
      transition: border-color 0.2s ease;
      font-family: inherit;
    }
    
    .reason-input:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
    
    .dialog-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 0 24px 24px 24px;
    }
    
    .btn {
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      border: none;
      min-width: 120px;
    }
    
    .btn-secondary {
      background: #f9fafb;
      color: #374151;
      border: 1px solid #d1d5db;
    }
    
    .btn-secondary:hover {
      background: #f3f4f6;
      border-color: #9ca3af;
    }
    
    .btn-danger {
      background: #ef4444;
      color: white;
    }
    
    .btn-danger:hover:not(:disabled) {
      background: #dc2626;
    }
      .btn-danger:disabled {
      background: #d1d5db;
      color: #9ca3af;
      cursor: not-allowed;
    }
    
    .btn-content {
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .loading-spinner {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      border-top-color: white;
      animation: spin 1s ease-in-out infinite;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class ConfirmationDialogComponent {
  reason: string = '';
  isProcessing: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<ConfirmationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmationDialogData
  ) {}

  onCancel(): void {
    if (!this.isProcessing) {
      this.dialogRef.close({ confirmed: false });
    }
  }

  onConfirm(): void {
    if (!this.isProcessing) {
      this.dialogRef.close({ 
        confirmed: true, 
        reason: this.data.needsReason ? this.reason?.trim() : undefined 
      });
    }
  }

  setProcessing(processing: boolean): void {
    this.isProcessing = processing;
  }
}
