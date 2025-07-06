import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
import { Bill } from '../../../../models/bill-management.model';
import { BillManagementService } from '../../../../services/bill-management.service';

@Component({
  selector: 'app-bill-detail-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bill-detail-modal.component.html',
  styleUrl: './bill-detail-modal.component.css'
})
export class BillDetailModalComponent implements OnChanges, OnDestroy {
  @Input() isOpen = false;
  @Input() billId: number | null = null;
  @Output() close = new EventEmitter<void>();

  private destroy$ = new Subject<void>();

  // State properties
  isLoading = false;
  hasError = false;
  errorMessage = '';

  // Data properties
  billDetails: Bill | null = null;

  constructor(private billService: BillManagementService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen && this.billId) {
      this.loadBillDetails();
    }
    
    if (changes['billId'] && this.billId && this.isOpen) {
      this.loadBillDetails();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Make this method public so template can access it
  loadBillDetails(): void {
    if (!this.billId) return;

    this.isLoading = true;
    this.hasError = false;
    this.billDetails = null;

    this.billService.getBillById(this.billId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (bill: Bill) => {
        this.billDetails = bill;
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading bill details:', error);
        this.hasError = true;
        this.errorMessage = error?.message || 'Failed to load bill details';
        this.isLoading = false;
      }
    });
  }

  onClose(): void {
    this.billDetails = null;
    this.hasError = false;
    this.isLoading = false;
    this.close.emit();
  }

  onBackdropClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }

  // Utility methods
  getPatientName(): string {
    if (!this.billDetails?.patient) return 'Unknown Patient';
    return this.billDetails.patient.name || 
           this.billDetails.patient.user?.name ||
           `Patient ${this.billDetails.patient.id}`;
  }

  getPatientEmail(): string | null {
    if (!this.billDetails?.patient) return null;
    return this.billDetails.patient.email || 
           this.billDetails.patient.user?.email || 
           null;
  }

  getDoctorName(): string {
    if (!this.billDetails?.doctor) return 'Unknown Doctor';
    return this.billDetails.doctor.name || 
           `Doctor ${this.billDetails.doctor.id}`;
  }

  getDoctorPhone(): string | null {
    if (!this.billDetails?.doctor) return null;
    return this.billDetails.doctor.phone || null;
  }

  getDoctorSpecialty(): string | null {
    if (!this.billDetails?.doctor) return null;
    
    // Check both possible locations for specialty based on your API
    return this.billDetails.doctor.specialty || 
           (this.billDetails.doctor.doctor && this.billDetails.doctor.doctor.specialty) || 
           null;
  }

  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  }

  formatCurrency(amount: string | number): string {
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(numericAmount || 0);
  }

  formatPaymentMethod(method: string): string {
    if (!method) return 'N/A';
    
    const methodMap: { [key: string]: string } = {
      'cash': 'Cash',
      'credit_card': 'Credit Card',
      'insurance': 'Insurance',
      'bank_transfer': 'Bank Transfer'
    };
    
    return methodMap[method.toLowerCase()] || method.replace('_', ' ');
  }

  getServiceTypeDisplayName(serviceType: string): string {
    const serviceTypes: { [key: string]: string } = {
      'CONSULTATION': 'Consultation',
      'XRAY': 'X-Ray',
      'PHYSIO': 'Physiotherapy',
      'THERAPY': 'Therapy Session',
      'EMERGENCY': 'Emergency Care',
      'IMAGING': 'Advanced Imaging',
      'VACCINE': 'Vaccination',
      'LAB': 'Laboratory Test',
      'SURGERY': 'Surgery',
      'CHECKUP': 'Health Checkup'
    };
    
    return serviceTypes[serviceType] || serviceType;
  }

  getServiceTypeIcon(serviceType: string): string {
    const icons: { [key: string]: string } = {
      'CONSULTATION': '👨‍⚕️',
      'XRAY': '🦴',
      'PHYSIO': '🏃‍♂️',
      'THERAPY': '🧠',
      'EMERGENCY': '🚨',
      'IMAGING': '📷',
      'VACCINE': '💉',
      'LAB': '🔬',
      'SURGERY': '🔪',
      'CHECKUP': '❤️'
    };
    
    return icons[serviceType] || '🏥';
  }

  getTotalAmount(): number {
    if (!this.billDetails?.items) return 0;
    return this.billDetails.items.reduce((total, item) => {
      const itemTotal = typeof item.total === 'string' ? parseFloat(item.total) : item.total;
      return total + (itemTotal || 0);
    }, 0);
  }

  downloadPdf(): void {
    if (!this.billDetails) return;

    this.isLoading = true; // Show loading state
    this.billService.downloadBillPdf(this.billDetails.id).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.isLoading = false) // Ensure loading state is cleared
    ).subscribe({
      next: (blob: Blob) => {
        // Check if we got a valid PDF (content type check)
        if (blob.type !== 'application/pdf') {
          console.error('Invalid content type received:', blob.type);
          alert('Server returned an invalid PDF format');
          return;
        }

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Bill-${this.billDetails!.bill_number}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error: any) => {
        console.error('Error downloading PDF:', error);
        alert('Failed to download PDF: ' + (error?.message || 'Unknown error'));
      }
    });
  }

  downloadAdminPdf(): void {
    if (!this.billDetails) return;

    this.isLoading = true; // Show loading state
    this.billService.downloadAdminBillPdf(this.billDetails.id).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.isLoading = false) // Ensure loading state is cleared
    ).subscribe({
      next: (blob: Blob) => {
        // Check if we got a valid PDF (content type check)
        if (blob.type !== 'application/pdf') {
          console.error('Invalid content type received:', blob.type);
          alert('Server returned an invalid PDF format');
          return;
        }

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Admin-Bill-${this.billDetails!.bill_number}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error: any) => {
        console.error('Error downloading admin PDF:', error);
        alert('Failed to download admin PDF: ' + (error?.message || 'Unknown error'));
      }
    });
  }
}
