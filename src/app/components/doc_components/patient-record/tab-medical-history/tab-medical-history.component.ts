import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { Patient } from '../../../../models/patient.model';
import { 
  MedicalHistoryService, 
  MedicalHistory, 
  CreateMedicalHistoryRequest,
  UpdateMedicalHistoryRequest 
} from '../../../../services/doc-services/medical-history.service';

@Component({
  selector: 'app-tab-medical-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tab-medical-history.component.html',
  styleUrls: ['./tab-medical-history.component.css']
})
export class TabMedicalHistoryComponent implements OnInit, OnDestroy {
  @Input() patient: Patient | null = null;
  
  // Data properties
  medicalHistories: MedicalHistory[] = [];
  currentHistory: MedicalHistory | null = null;
  loading: boolean = false;
  error: string | null = null;
  
  // Search and filter
  searchTerm: string = '';
  activeSection: string = 'all'; // all, conditions, surgeries, medications, allergies
  
  // Modal states
  showAddHistoryModal: boolean = false;
  showEditHistoryModal: boolean = false;
  showDeleteModal: boolean = false;
  selectedHistory: MedicalHistory | null = null;
  
  // Form data
  historyForm = {
    current_medical_conditions: [] as string[],
    past_surgeries: [] as string[],
    chronic_diseases: [] as string[],
    current_medications: [] as string[],
    allergies: [] as string[]
  };
  
  // Input fields for adding new items
  newCondition: string = '';
  newSurgery: string = '';
  newChronicDisease: string = '';
  newMedication: string = '';
  newAllergy: string = '';
  
  // Statistics
  stats = {
    totalConditions: 0,
    totalSurgeries: 0,
    totalMedications: 0,
    totalAllergies: 0,
    totalChronicDiseases: 0,
    lastUpdated: ''
  };
  
  private destroy$ = new Subject<void>();
  
  constructor(private medicalHistoryService: MedicalHistoryService) {}
  
  ngOnInit(): void {
    if (this.patient?.id) {
      this.loadMedicalHistories();
    }
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  // ===== DATA LOADING =====
  
  private parseStringArray(value: any): string[] {
    console.log('Parsing value:', value, 'Type:', typeof value); // Debug log
    
    if (!value) return [];
    
    // If it's already an array, return a clean copy
    if (Array.isArray(value)) {
      return value.filter(item => item && typeof item === 'string' && item.trim());
    }
    
    // If it's a string that looks like JSON array, parse it
    if (typeof value === 'string') {
      // Handle empty string
      if (value.trim() === '') return [];
      
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          return parsed.filter(item => item && typeof item === 'string' && item.trim());
        }
        // If it's a single string value, return as array
        return [value.trim()];
      } catch (e) {
        console.warn('Failed to parse JSON, treating as comma-separated:', value);
        // If parsing fails, treat as comma-separated string
        return value.split(',').map(item => item.trim()).filter(item => item.length > 0);
      }
    }
    
    // For any other type, try to convert to string and return as single-item array
    if (value.toString && value.toString().trim()) {
      return [value.toString().trim()];
    }
    
    return [];
  }
  
  async loadMedicalHistories() {
    if (!this.patient?.id) return;
    
    this.loading = true;
    this.error = null;
    
    try {
      this.medicalHistories = await this.medicalHistoryService.getPatientMedicalHistories(this.patient.id);
      
      // Parse all string arrays
      this.medicalHistories = this.medicalHistories.map(history => ({
        ...history,
        conditions: this.parseStringArray(history.conditions),
        surgeries: this.parseStringArray(history.surgeries),
        chronicDiseases: this.parseStringArray(history.chronicDiseases),
        medications: this.parseStringArray(history.medications),
        allergies: this.parseStringArray(history.allergies)
      }));
      
      // Use the most recent history as current
      if (this.medicalHistories.length > 0) {
        this.currentHistory = this.medicalHistories.sort((a, b) => 
          new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
        )[0];
      }
      
      this.calculateStats();
    } catch (error: any) {
      this.error = error.message || 'Failed to load medical histories';
      console.error('Error loading medical histories:', error);
    } finally {
      this.loading = false;
    }
  }
  
  private calculateStats() {
    if (!this.currentHistory) {
      this.stats = {
        totalConditions: 0,
        totalSurgeries: 0,
        totalMedications: 0,
        totalAllergies: 0,
        totalChronicDiseases: 0,
        lastUpdated: ''
      };
      return;
    }
    
    this.stats = {
      totalConditions: this.currentHistory.conditions?.length || 0,
      totalSurgeries: this.currentHistory.surgeries?.length || 0,
      totalMedications: this.currentHistory.medications?.length || 0,
      totalAllergies: this.currentHistory.allergies?.length || 0,
      totalChronicDiseases: this.currentHistory.chronicDiseases?.length || 0,
      lastUpdated: this.formatDate(this.currentHistory.lastUpdated)
    };
  }
  
  // ===== MODAL MANAGEMENT =====
  
  openAddHistoryModal() {
    this.selectedHistory = null;
    this.historyForm = {
      current_medical_conditions: [],
      past_surgeries: [],
      chronic_diseases: [],
      current_medications: [],
      allergies: []
    };
    this.showAddHistoryModal = true;
  }
  
  openEditHistoryModal(history: MedicalHistory) {
    console.log('Opening edit modal for history:', history); // Debug log
    
    // Validate history object
    if (!history || !history.id) {
      console.error('Invalid history object:', history);
      this.error = 'Unable to edit: invalid medical history data';
      return;
    }
    
    // Ensure arrays are properly initialized and parsed
    this.selectedHistory = history;
    this.historyForm = {
      current_medical_conditions: this.parseStringArray(history.conditions),
      past_surgeries: this.parseStringArray(history.surgeries),
      chronic_diseases: this.parseStringArray(history.chronicDiseases),
      current_medications: this.parseStringArray(history.medications),
      allergies: this.parseStringArray(history.allergies)
    };
    
    // Clear input fields
    this.clearInputFields();
    
    // Clear any existing errors
    this.error = null;
    
    // Set modal state
    this.showEditHistoryModal = true;
    this.showAddHistoryModal = false;
    this.showDeleteModal = false;
    
    console.log('Edit modal opened with form data:', this.historyForm); // Debug log
    console.log('Selected history ID:', this.selectedHistory.id); // Debug log
  }
  
  openDeleteModal(history: MedicalHistory) {
    this.selectedHistory = history;
    this.showDeleteModal = true;
  }
  
  closeModals() {
    console.log('Closing all modals'); // Debug log
    
    this.showAddHistoryModal = false;
    this.showEditHistoryModal = false;
    this.showDeleteModal = false;
    this.selectedHistory = null;
    this.clearInputFields();
    
    // Reset form
    this.historyForm = {
      current_medical_conditions: [],
      past_surgeries: [],
      chronic_diseases: [],
      current_medications: [],
      allergies: []
    };
  }
  
  private clearInputFields() {
    this.newCondition = '';
    this.newSurgery = '';
    this.newChronicDisease = '';
    this.newMedication = '';
    this.newAllergy = '';
  }
  
  // ===== CRUD OPERATIONS =====
  
  async createMedicalHistory() {
    if (!this.patient?.id) return;
    
    // DEBUG: Check what we're about to send
    console.log('=== CREATE DEBUG ===');
    console.log('Form data before submission:', this.historyForm);
    console.log('Input fields:', {
      newCondition: this.newCondition,
      newSurgery: this.newSurgery,
      newChronicDisease: this.newChronicDisease,
      newMedication: this.newMedication,
      newAllergy: this.newAllergy
    });
    
    // Check if form has any data
    const hasData = 
      this.historyForm.current_medical_conditions.length > 0 ||
      this.historyForm.past_surgeries.length > 0 ||
      this.historyForm.chronic_diseases.length > 0 ||
      this.historyForm.current_medications.length > 0 ||
      this.historyForm.allergies.length > 0;
    
    if (!hasData) {
      this.error = 'Please add at least one item before creating medical history';
      console.log('No data to submit!');
      return;
    }
    
    try {
      const request: CreateMedicalHistoryRequest = {
        patient_id: this.patient.id,
        current_medical_conditions: this.historyForm.current_medical_conditions,
        past_surgeries: this.historyForm.past_surgeries,
        chronic_diseases: this.historyForm.chronic_diseases,
        current_medications: this.historyForm.current_medications,
        allergies: this.historyForm.allergies
      };
      
      console.log('Request to send:', request);
      
      const newHistory = await this.medicalHistoryService.createMedicalHistory(request);
      this.medicalHistories.unshift(newHistory);
      this.currentHistory = newHistory;
      this.calculateStats();
      this.closeModals();
      
      console.log('Medical history created successfully');
    } catch (error: any) {
      console.error('Error creating medical history:', error);
      this.error = error.message || 'Failed to create medical history';
    }
  }
  
  async updateMedicalHistory() {
    if (!this.patient?.id || !this.selectedHistory) return;
    
    try {
      console.log('=== COMPONENT DEBUG ===');
      console.log('Raw form data:', this.historyForm);
      console.log('Form data types:');
      console.log('- current_medical_conditions:', typeof this.historyForm.current_medical_conditions, Array.isArray(this.historyForm.current_medical_conditions));
      console.log('- past_surgeries:', typeof this.historyForm.past_surgeries, Array.isArray(this.historyForm.past_surgeries));
      console.log('- chronic_diseases:', typeof this.historyForm.chronic_diseases, Array.isArray(this.historyForm.chronic_diseases));
      console.log('- current_medications:', typeof this.historyForm.current_medications, Array.isArray(this.historyForm.current_medications));
      console.log('- allergies:', typeof this.historyForm.allergies, Array.isArray(this.historyForm.allergies));
      
      // FORCE everything to be arrays
      const forceArray = (value: any): string[] => {
        if (Array.isArray(value)) return value.filter(item => item && typeof item === 'string');
        if (typeof value === 'string') {
          try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : [value];
          } catch {
            return [value];
          }
        }
        return [];
      };

      const request = {
        patient_id: Number(this.patient.id),
        current_medical_conditions: forceArray(this.historyForm.current_medical_conditions),
        past_surgeries: forceArray(this.historyForm.past_surgeries),
        chronic_diseases: forceArray(this.historyForm.chronic_diseases),
        current_medications: forceArray(this.historyForm.current_medications),
        allergies: forceArray(this.historyForm.allergies)
      };
      
      console.log('Final request to send:', request);
      console.log('Final request JSON:', JSON.stringify(request, null, 2));
      console.log('=======================');
      
      const result = await this.medicalHistoryService.updateMedicalHistory(
        Number(this.patient.id),
        Number(this.selectedHistory.id),
        request
      );
      
      console.log('Success:', result);
      this.closeModals();
      this.loadMedicalHistories(); // Reload data
      
    } catch (error: any) {
      console.error('Failed:', error);
      this.error = error.message;
    }
  }
  
  async deleteMedicalHistory() {
    if (!this.patient?.id || !this.selectedHistory) return;
    
    try {
      await this.medicalHistoryService.deleteMedicalHistory(
        this.patient.id,
        this.selectedHistory.id
      );
      
      // Remove from local array
      this.medicalHistories = this.medicalHistories.filter(h => h.id !== this.selectedHistory!.id);
      
      // Update current history if it was deleted
      if (this.currentHistory?.id === this.selectedHistory.id) {
        this.currentHistory = this.medicalHistories.length > 0 ? this.medicalHistories[0] : null;
      }
      
      this.calculateStats();
      this.closeModals();
      
      console.log('Medical history deleted successfully');
    } catch (error: any) {
      console.error('Error deleting medical history:', error);
      this.error = error.message || 'Failed to delete medical history';
    }
  }
  
  // ===== FORM HELPERS =====
  
  addCondition() {
    if (this.newCondition.trim() && !this.historyForm.current_medical_conditions.includes(this.newCondition.trim())) {
      this.historyForm.current_medical_conditions.push(this.newCondition.trim());
      this.newCondition = '';
    }
  }
  
  removeCondition(index: number) {
    this.historyForm.current_medical_conditions.splice(index, 1);
  }
  
  addSurgery() {
    if (this.newSurgery.trim() && !this.historyForm.past_surgeries.includes(this.newSurgery.trim())) {
      this.historyForm.past_surgeries.push(this.newSurgery.trim());
      this.newSurgery = '';
    }
  }
  
  removeSurgery(index: number) {
    this.historyForm.past_surgeries.splice(index, 1);
  }
  
  addChronicDisease() {
    if (this.newChronicDisease.trim() && !this.historyForm.chronic_diseases.includes(this.newChronicDisease.trim())) {
      this.historyForm.chronic_diseases.push(this.newChronicDisease.trim());
      this.newChronicDisease = '';
    }
  }
  
  removeChronicDisease(index: number) {
    this.historyForm.chronic_diseases.splice(index, 1);
  }
  
  addMedication() {
    if (this.newMedication.trim() && !this.historyForm.current_medications.includes(this.newMedication.trim())) {
      this.historyForm.current_medications.push(this.newMedication.trim());
      this.newMedication = '';
    }
  }
  
  removeMedication(index: number) {
    this.historyForm.current_medications.splice(index, 1);
  }
  
  addAllergy() {
    if (this.newAllergy.trim() && !this.historyForm.allergies.includes(this.newAllergy.trim())) {
      this.historyForm.allergies.push(this.newAllergy.trim());
      this.newAllergy = '';
    }
  }
  
  removeAllergy(index: number) {
    this.historyForm.allergies.splice(index, 1);
  }
  
  // ===== UTILITY METHODS =====
  
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }
  
  refreshData() {
    this.loadMedicalHistories();
  }
  
  setActiveSection(section: string) {
    this.activeSection = section;
  }
  
  trackByIndex(index: number, item: any): number {
    return index;
  }
}