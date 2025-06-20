import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { VitalSignsAnalyticsComponent } from '../vital-signs-analytics/vital-signs-analytics.component';

interface VitalSignsFormData {
  bloodPressureSystolic: number;
  bloodPressureDiastolic: number;
  pulseRate: number;
  temperature: number;
  temperatureUnit: string;
  respiratoryRate: number;
  oxygenSaturation: number;
  weight: number;
  weightUnit: string;
  height: number;
  heightUnit: string;
  notes: string;
  recordedAt: string;
}

@Component({
  selector: 'app-vital-signs-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, VitalSignsAnalyticsComponent],
  templateUrl: './vital-signs-modal.component.html',
  styleUrls: ['./vital-signs-modal.component.css']
})
export class VitalSignsModalComponent implements OnInit {
  @Input() isOpen: boolean = false;
  @Input() vitals: any[] = [];
  @Input() patientId: string = '';
  
  @Output() closeModal = new EventEmitter<void>();
  @Output() vitalAdded = new EventEmitter<any>();
  @Output() vitalUpdated = new EventEmitter<any>();
  @Output() vitalDeleted = new EventEmitter<number>();

    Math = Math;

  // Modal state
  currentView: 'list' | 'add' | 'edit' = 'list';
  selectedVital: any = null;
  
  // Form
  vitalForm: FormGroup;
  
  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;
  
  // Search and filter
  searchTerm: string = '';
  filterStatus: string = 'all';
  
  // Add analytics state
  showAnalytics: boolean = false;
  
  constructor(private fb: FormBuilder) {
    this.vitalForm = this.createForm();
  }
  
  ngOnInit() {
    this.resetForm();
  }
  
  // Form creation
  createForm(): FormGroup {
    return this.fb.group({
      bloodPressureSystolic: [120, [Validators.required, Validators.min(60), Validators.max(250)]],
      bloodPressureDiastolic: [80, [Validators.required, Validators.min(40), Validators.max(150)]],
      pulseRate: [70, [Validators.required, Validators.min(30), Validators.max(200)]],
      temperature: [98.6, [Validators.required, Validators.min(95), Validators.max(110)]],
      temperatureUnit: ['°F', Validators.required],
      respiratoryRate: [16, [Validators.required, Validators.min(8), Validators.max(40)]],
      oxygenSaturation: [98, [Validators.required, Validators.min(70), Validators.max(100)]],
      weight: [70, [Validators.required, Validators.min(20), Validators.max(300)]],
      weightUnit: ['kg', Validators.required],
      height: [170, [Validators.required, Validators.min(100), Validators.max(250)]],
      heightUnit: ['cm', Validators.required],
      notes: [''],
      recordedAt: [new Date().toISOString().slice(0, 16), Validators.required]
    });
  }
  
  // Modal control
  close(): void {
    this.isOpen = false;
    this.currentView = 'list';
    this.selectedVital = null;
    this.closeModal.emit();
  }
  
  // View switching
  showAddForm(): void {
    this.currentView = 'add';
    this.resetForm();
  }
  
  showEditForm(vital: any): void {
    this.currentView = 'edit';
    this.selectedVital = vital;
    this.populateForm(vital);
  }
  
  showList(): void {
    this.currentView = 'list';
    this.selectedVital = null;
  }
  
  // Form operations
  resetForm(): void {
    this.vitalForm.reset({
      bloodPressureSystolic: 120,
      bloodPressureDiastolic: 80,
      pulseRate: 70,
      temperature: 98.6,
      temperatureUnit: '°F',
      respiratoryRate: 16,
      oxygenSaturation: 98,
      weight: 70,
      weightUnit: 'kg',
      height: 170,
      heightUnit: 'cm',
      notes: '',
      recordedAt: new Date().toISOString().slice(0, 16)
    });
  }
  
  populateForm(vital: any): void {
    this.vitalForm.patchValue({
      bloodPressureSystolic: vital.bloodPressure?.systolic || vital.systolic,
      bloodPressureDiastolic: vital.bloodPressure?.diastolic || vital.diastolic,
      pulseRate: vital.pulseRate || vital.pulse,
      temperature: parseFloat(vital.temperature?.value) || vital.temperature,
      temperatureUnit: vital.temperature?.unit || '°F',
      respiratoryRate: vital.respiratoryRate,
      oxygenSaturation: vital.oxygenSaturation,
      weight: parseFloat(vital.weight?.value) || vital.weight,
      weightUnit: vital.weight?.unit || 'kg',
      height: parseFloat(vital.height?.value) || vital.height,
      heightUnit: vital.height?.unit || 'cm',
      notes: vital.notes || '',
      recordedAt: vital.recordedAt ? new Date(vital.recordedAt).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16)
    });
  }
  
  // CRUD operations
  saveVital(): void {
    if (this.vitalForm.valid) {
      const formData = this.vitalForm.value;
      const vitalData = {
        id: this.currentView === 'edit' ? this.selectedVital.id : Date.now(),
        bloodPressure: {
          systolic: formData.bloodPressureSystolic,
          diastolic: formData.bloodPressureDiastolic,
          reading: `${formData.bloodPressureSystolic}/${formData.bloodPressureDiastolic}`
        },
        pulseRate: formData.pulseRate,
        temperature: {
          value: formData.temperature.toString(),
          unit: formData.temperatureUnit,
          display: `${formData.temperature}${formData.temperatureUnit}`
        },
        respiratoryRate: formData.respiratoryRate,
        oxygenSaturation: formData.oxygenSaturation,
        weight: {
          value: formData.weight.toString(),
          unit: formData.weightUnit,
          display: `${formData.weight} ${formData.weightUnit}`
        },
        height: {
          value: formData.height.toString(),
          unit: formData.heightUnit,
          display: `${formData.height} ${formData.heightUnit}`
        },
        notes: formData.notes,
        recordedAt: formData.recordedAt,
        recordedBy: 'Current User' // TODO: Get from auth service
      };
      
      if (this.currentView === 'edit') {
        this.vitalUpdated.emit(vitalData);
      } else {
        this.vitalAdded.emit(vitalData);
      }
      
      this.showList();
    }
  }
  
  deleteVital(vitalId: number): void {
    if (confirm('Are you sure you want to delete this vital signs record?')) {
      this.vitalDeleted.emit(vitalId);
    }
  }
  
  // Filtering and pagination
  get filteredVitals(): any[] {
    let filtered = [...this.vitals];
    
    // Apply search filter
    if (this.searchTerm) {
      filtered = filtered.filter(vital => 
        this.getRecordedBy(vital).toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        this.getRecordedDate(vital).includes(this.searchTerm)
      );
    }
    
    // Sort by date (newest first)
    return filtered.sort((a, b) => {
      const dateA = new Date(a.recordedAt || a.date).getTime();
      const dateB = new Date(b.recordedAt || b.date).getTime();
      return dateB - dateA;
    });
  }
  
  get paginatedVitals(): any[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredVitals.slice(startIndex, startIndex + this.itemsPerPage);
  }
  
  get totalPages(): number {
    return Math.ceil(this.filteredVitals.length / this.itemsPerPage);
  }
  
  // Helper methods (reuse from original component)
  getSystolic(vital: any): number {
    return vital.bloodPressure?.systolic || vital.systolic || 0;
  }
  
  getDiastolic(vital: any): number {
    return vital.bloodPressure?.diastolic || vital.diastolic || 0;
  }
  
  getPulse(vital: any): number {
    return vital.pulseRate || vital.pulse || 0;
  }
  
  getTemperature(vital: any): number {
    return parseFloat(vital.temperature?.value) || vital.temperature || 0;
  }
  
  getTemperatureDisplay(vital: any): string {
    return vital.temperature?.display || `${vital.temperature}°F` || 'N/A';
  }
  
  getRecordedDate(vital: any): string {
    return vital.recordedAt || vital.date || '';
  }
  
  getRecordedBy(vital: any): string {
    return vital.recordedBy || 'Unknown';
  }
  
  getBPStatus(systolic: number, diastolic: number): string {
    if (systolic >= 180 || diastolic >= 120) {
      return 'crisis';
    } else if (systolic >= 140 || diastolic >= 90) {
      return 'high';
    } else if (systolic >= 130 || diastolic >= 80) {
      return 'elevated';
    } else if (systolic >= 90 && diastolic >= 60) {
      return 'normal';
    } else {
      return 'low';
    }
  }
  
  getBPStatusColor(status: string): string {
    switch (status) {
      case 'crisis': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'elevated': return 'text-yellow-600 bg-yellow-100';
      case 'normal': return 'text-green-600 bg-green-100';
      case 'low': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }

  // Add method to open analytics
  openAnalytics(): void {
    this.showAnalytics = true;
  }
  
  closeAnalytics(): void {
    this.showAnalytics = false;
  }

trackByVitalId(index: number, vital: any): any {
  return vital.id || index;
}
}