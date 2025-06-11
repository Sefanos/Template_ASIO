import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  Bill,
  BillCreatePayload,
  BillItem,
  BillListParams,
  Pagination
} from '../../../../models/bill-management.model';
import { BillManagementService } from '../../../../services/bill-management.service';

@Component({
  selector: 'app-bills',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './bills.component.html',
  styleUrl: './bills.component.css'
})
export class BillsComponent implements OnInit {
  // List view properties
  bills: Bill[] = [];
  pagination: Pagination | null = null;
  loading = false;
  error: string | null = null;
  
  // Filter properties
  filterForm: FormGroup;
  
  // Create/edit properties
  billForm: FormGroup;
  isEditing = false;
  currentBillId: number | null = null;
  showBillForm = false;
  
  // Detail view properties
  selectedBill: Bill | null = null;
  showBillDetail = false;
  
  // Payment methods and service types (these could come from API)
  paymentMethods = ['Cash', 'Credit Card', 'Insurance', 'Bank Transfer'];
  serviceTypes = ['Consultation', 'Procedure', 'Medication', 'Laboratory', 'Imaging', 'Other'];

  constructor(
    private billService: BillManagementService,
    private fb: FormBuilder
  ) {
    // Initialize filter form
    this.filterForm = this.fb.group({
      search: [''],
      from_date: [''],
      to_date: [''],
      patient_id: [''],
      doctor_user_id: [''],
      payment_method: [''],
      service_type: [''],
      amount_min: [''],
      amount_max: ['']
    });
    
    // Initialize bill form
    this.billForm = this.fb.group({
      patient_id: ['', Validators.required],
      doctor_user_id: ['', Validators.required],
      issue_date: [this.formatDate(new Date()), Validators.required],
      payment_method: ['', Validators.required],
      description: [''],
      generate_pdf: [true],
      items: this.fb.array([this.createItemFormGroup()])
    });
  }

  ngOnInit(): void {
    this.loadBills();
  }

  // Load bills with optional filters
  loadBills(page: number = 1): void {
    this.loading = true;
    const params: BillListParams = { 
      page,
      per_page: 10,
      ...this.filterForm.value
    };
    
    // Remove empty values
    Object.keys(params).forEach(key => {
      if (params[key as keyof BillListParams] === '' || params[key as keyof BillListParams] === null) {
        delete params[key as keyof BillListParams];
      }
    });
    
    this.billService.getBills(params)
      .subscribe({
        next: (response) => {
          this.bills = response.items;
          this.pagination = response.pagination;
          this.loading = false;
        },
        error: (err) => {
          this.error = err.message || 'Failed to load bills';
          this.loading = false;
        }
      });
  }

  // Apply filters
  applyFilters(): void {
    this.loadBills(1); // Reset to first page when applying filters
  }

  // Reset filters
  resetFilters(): void {
    this.filterForm.reset();
    this.loadBills(1);
  }

  // Open bill creation form
  openCreateForm(): void {
    this.isEditing = false;
    this.currentBillId = null;
    this.resetBillForm();
    this.showBillForm = true;
    this.showBillDetail = false;
  }

  // Open bill edit form
  openEditForm(bill: Bill): void {
    this.isEditing = true;
    this.currentBillId = bill.id;
    this.populateBillForm(bill);
    this.showBillForm = true;
    this.showBillDetail = false;
  }

  // View bill details
  viewBillDetails(billId: number): void {
    this.loading = true;
    this.billService.getBillById(billId)
      .subscribe({
        next: (bill) => {
          this.selectedBill = bill;
          this.showBillDetail = true;
          this.showBillForm = false;
          this.loading = false;
        },
        error: (err) => {
          this.error = err.message || `Failed to load bill ${billId}`;
          this.loading = false;
        }
      });
  }

  // Close forms/details
  closeAllForms(): void {
    this.showBillForm = false;
    this.showBillDetail = false;
  }

  // Delete bill
  deleteBill(billId: number): void {
    if (!confirm('Are you sure you want to delete this bill?')) {
      return;
    }
    
    this.loading = true;
    this.billService.deleteBill(billId)
      .subscribe({
        next: () => {
          this.loadBills(this.pagination?.current_page || 1);
          this.closeAllForms();
          this.loading = false;
        },
        error: (err) => {
          this.error = err.message || `Failed to delete bill ${billId}`;
          this.loading = false;
        }
      });
  }

  // Download bill PDF
  downloadPdf(billId: number): void {
    this.loading = true;
    this.billService.downloadBillPdf(billId)
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `bill-${billId}.pdf`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Failed to download PDF';
          this.loading = false;
        }
      });
  }

  // Generate PDF for a bill
  generatePdf(billId: number): void {
    this.loading = true;
    this.billService.generateBillPdf(billId)
      .subscribe({
        next: (response) => {
          // Refresh bill details to get updated PDF path
          this.viewBillDetails(billId);
          this.loading = false;
        },
        error: (err) => {
          this.error = err.message || `Failed to generate PDF for bill ${billId}`;
          this.loading = false;
        }
      });
  }

  // Submit bill form (create/update)
  submitBillForm(): void {
    if (this.billForm.invalid) {
      this.markFormGroupTouched(this.billForm);
      return;
    }
    
    const formValue = this.billForm.value;
    const payload: BillCreatePayload = {
      patient_id: Number(formValue.patient_id),
      doctor_user_id: Number(formValue.doctor_user_id),
      issue_date: formValue.issue_date,
      payment_method: formValue.payment_method,
      description: formValue.description || '',
      generate_pdf: formValue.generate_pdf,
      items: formValue.items
    };
    
    this.loading = true;
    
    if (this.isEditing && this.currentBillId) {
      // Update existing bill
      this.billService.updateBill(this.currentBillId, payload)
        .subscribe({
          next: (bill) => {
            this.loadBills(this.pagination?.current_page || 1);
            this.closeAllForms();
            this.loading = false;
          },
          error: (err) => {
            this.error = err.message || 'Failed to update bill';
            this.loading = false;
          }
        });
    } else {
      // Create new bill
      this.billService.createBill(payload)
        .subscribe({
          next: (bill) => {
            this.loadBills(this.pagination?.current_page || 1);
            this.closeAllForms();
            this.loading = false;
          },
          error: (err) => {
            this.error = err.message || 'Failed to create bill';
            this.loading = false;
          }
        });
    }
  }

  // Delete bill item
  deleteBillItem(billId: number, itemId: number): void {
    if (!confirm('Are you sure you want to delete this item?')) {
      return;
    }
    
    this.loading = true;
    this.billService.deleteBillItem(billId, itemId)
      .subscribe({
        next: () => {
          // Refresh bill details
          this.viewBillDetails(billId);
          this.loading = false;
        },
        error: (err) => {
          this.error = err.message || `Failed to delete item`;
          this.loading = false;
        }
      });
  }

  // Form array helpers
  get itemsArray(): FormArray {
    return this.billForm.get('items') as FormArray;
  }

  createItemFormGroup(): FormGroup {
    return this.fb.group({
      service_type: ['', Validators.required],
      description: ['', Validators.required],
      price: ['', [Validators.required, Validators.min(0)]]
    });
  }

  addItem(): void {
    this.itemsArray.push(this.createItemFormGroup());
  }

  removeItem(index: number): void {
    if (this.itemsArray.length > 1) {
      this.itemsArray.removeAt(index);
    }
  }

  // Helper methods
  resetBillForm(): void {
    this.billForm.reset({
      issue_date: this.formatDate(new Date()),
      generate_pdf: true
    });
    
    // Reset items array to have one empty item
    const itemsControl = this.billForm.get('items') as FormArray;
    while (itemsControl.length > 0) {
      itemsControl.removeAt(0);
    }
    itemsControl.push(this.createItemFormGroup());
  }

  populateBillForm(bill: Bill): void {
    // Get the bill items first
    this.billService.getBillItems(bill.id)
      .subscribe({
        next: (items) => {
          this.billForm.patchValue({
            patient_id: bill.patient_id,
            doctor_user_id: bill.doctor_user_id,
            issue_date: this.formatDate(new Date(bill.issue_date)),
            payment_method: bill.payment_method,
            description: bill.description,
            generate_pdf: true
          });
          
          // Reset items array
          const itemsControl = this.billForm.get('items') as FormArray;
          while (itemsControl.length > 0) {
            itemsControl.removeAt(0);
          }
          
          // Add each item
          items.forEach(item => {
            const itemGroup = this.fb.group({
              service_type: [item.service_type, Validators.required],
              description: [item.description, Validators.required],
              price: [typeof item.price === 'string' ? parseFloat(item.price) : item.price, [Validators.required, Validators.min(0)]]
            });
            itemsControl.push(itemGroup);
          });
          
          // If no items, add an empty one
          if (items.length === 0) {
            itemsControl.push(this.createItemFormGroup());
          }
        },
        error: (err) => {
          this.error = err.message || `Failed to load bill items`;
        }
      });
  }

  formatDate(date: Date): string {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) {
      month = '0' + month;
    }
    if (day.length < 2) {
      day = '0' + day;
    }

    return [year, month, day].join('-');
  }

  markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else if (control instanceof FormArray) {
        (control as FormArray).controls.forEach(c => {
          if (c instanceof FormGroup) {
            this.markFormGroupTouched(c);
          }
        });
      }
    });
  }

  // Pagination
  goToPage(page: number): void {
    if (page !== this.pagination?.current_page) {
      this.loadBills(page);
    }
  }
  
  // Calculate bill total
  calculateTotal(items: BillItem[]): number {
    return items.reduce((total, item) => {
      const itemTotal = typeof item.total === 'string' ? parseFloat(item.total) : item.total;
      return total + itemTotal;
    }, 0);
  }
  
  // Format currency
  formatCurrency(value: string | number): string {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return numValue.toFixed(2);
  }
}
