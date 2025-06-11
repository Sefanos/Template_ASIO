import { ChangeDetectorRef, Component, HostListener, OnInit } from '@angular/core';
import { MedicalHistoryService } from '../../../core/patient/services/medical-history.service';
import { PrescriptionService } from '../../../core/patient/services/prescription-service.service';
import { LabResultService } from '../../../core/patient/services/lab-result-service.service';
import { ToastService } from '../../../shared/services/toast.service';
 
export interface MedicalRecordItem {
  id: string;
  type:  'LabResult' | 'Image' | 'Prescription';
  title: string;
  recordDate: string; // Date affichée sur la carte et dans le modal (e.g., "May 2, 2025")
  doctor?: string;
  summary: string; // Court résumé pour la carte
  details: string; // Détails complets pour le modal
  tagText: string;
  tagClass: string; // Classe CSS pour la couleur du tag

  // Champs spécifiques au type pour le modal
  resultDate?: string; // Pour LabResult
  performedBy?: string; // Pour LabResult
  imageDetails?: string; // Pour Image
  takenBy?: string; // Pour Image
  imageUrl?: string; // Pour Image (placeholder pour l'instant)
  status?: 'active' | 'completed';
}
export interface MedicalHistoryData {
  currentMedicalConditions: string[];
  pastSurgeries: string[];
  chronicDiseases: string[];
  currentMedications: string[];
  allergies: string[];
  vitalSigns?: VitalSignsData;
  lastUpdated: string | Date | null;
}
export interface VitalSign {
  label: string;
  value: string;
  unit: string;
  icon: string; // Classe Font Awesome
}
export interface VitalSignsData {
  lastRecorded: string | Date | null;
  bloodPressure?: VitalSign;
  pulse?: VitalSign;
  temperature?: VitalSign;
  respiratoryRate?: VitalSign;
  oxygenSaturation?: VitalSign;
  weight?: VitalSign;
  height?: VitalSign;
}
 

@Component({
  selector: 'app-medical-record',
  standalone: false,
  templateUrl: './medical-record.component.html',
  styleUrl: './medical-record.component.css'
})
export class MedicalRecordComponent implements OnInit{
  tabs: string[] = ['MedicalHistory', 'LabResult', 'Image', 'Prescription'];
  activeTab: string = 'MedicalHistory'; // 'All', 'Examinations', 'LabResults', 'Images', 'Prescriptions'
  searchTerm: string = '';

  allRecords: MedicalRecordItem[] = [];
  filteredRecords: MedicalRecordItem[] = [];

  selectedRecord: MedicalRecordItem | null = null;
  isModalOpen: boolean = false;

  isDateFilterOpen: boolean = false;
  dateFrom: string = '';
  dateTo: string = '';
     
    isAdvancedFilterOpen: boolean = false;
    availableRecordTypes: string[] = ['Prescription', 'LabResult', 'Image'];
    availableDoctors: string[] = [];
  
    selectedRecordTypes: { [key: string]: boolean } = {};
    selectedDoctors: { [key: string]: boolean } = {};

      // Propriétés pour l'historique médical
  medicalHistory: MedicalHistoryData | null = null;
  isLoadingMedicalHistory: boolean = true;
  medicalHistoryErrorMessage: string | null = null;

  isLoadingRecords: boolean = false; 
  recordsError: string | null = null;
  // TEMPORAIRE: ID Patient (à remplacer par l'authentification)
  private patientId = 1; // TEMPORAIRE: ID Patient

  constructor(
    private medicalHistoryService: MedicalHistoryService,
    private prescriptionService: PrescriptionService, // Injection de PrescriptionService
    private labResultService: LabResultService, // Inject LabResultService
    private cdr: ChangeDetectorRef,
    private toastService: ToastService
  ) { }
  
 
  
 


  ngOnInit(): void {
    this.initializeStaticLabAndImageData(); // Initialise les données statiques pour Image
    this.loadMedicalHistory();
    this.loadPrescriptions();
    this.loadLabResults(); 
  }
  initializeStaticLabAndImageData(): void {
    // Conserver les données statiques pour LabResult et Image pour l'instant
    const staticImageRecords: MedicalRecordItem[] = [

      {
        id: 'img1', type: 'Image', title: 'Chest X-Ray', recordDate: '2025-03-10T14:30:00Z', doctor: 'Dr. Emily Chen',
        summary: 'Standard PA and lateral views of chest. No evidence of acute cardiopulmonary disease.',
        details: 'Standard PA and lateral views of chest. Lungs are clear. Heart size is normal. No evidence of acute cardiopulmonary disease. Minor degenerative changes in the thoracic spine.',
        tagText: 'Clear', tagClass: 'tag-image-clear', imageDetails: 'PA and lateral views', takenBy: 'Radiology Department', imageUrl: 'assets/images/round-pneumonia.jpg', status: 'completed'
      },
      {
        id: 'img2', type: 'Image', title: 'Right Knee MRI', recordDate: '2025-03-15T09:00:00Z', doctor: 'Dr. Emily Chen',
        summary: 'MRI of right knee shows mild meniscus tear in the medial compartment. No evidence of ligament damage or fracture.',
        details: 'MRI of right knee shows mild degenerative fraying and a small radial tear of the posterior horn of the medial meniscus. ACL, PCL, and collateral ligaments are intact. No fracture or dislocation.',
        tagText: 'Meniscus Tear', tagClass: 'tag-image-finding', imageDetails: 'Sagittal view of right knee', takenBy: 'Radiology Department', imageUrl: 'assets/placeholder-image.png', status: 'completed'
      }
    ];
    this.allRecords = this.allRecords.filter(r => r.type !== 'Image');
    this.allRecords = [...this.allRecords, ...staticImageRecords];
  }
  populateAvailableDoctors(): void {
    const doctors = new Set<string>();
    this.allRecords.forEach(record => {
      if (record.doctor) {
        doctors.add(record.doctor);
      }
    });
    this.availableDoctors = Array.from(doctors).sort();
  }

 
  loadMedicalHistory(): void {
    this.isLoadingMedicalHistory = true;
    this.medicalHistoryErrorMessage = null;
    this.medicalHistoryService.getMedicalHistory(this.patientId).subscribe({
      next: (data) => {
        this.medicalHistory = data; // Le service devrait retourner la structure complète
        this.isLoadingMedicalHistory = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching medical history:', err);
        this.medicalHistoryErrorMessage = 'Failed to load medical history. Please try again later.';
        this.isLoadingMedicalHistory = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadPrescriptions(): void {
    this.isLoadingRecords = true; // Peut-être un indicateur spécifique pour les prescriptions
    this.recordsError = null;
    this.prescriptionService.getPrescriptions(this.patientId).subscribe({
      next: (prescriptions) => {
        // S'assurer que les prescriptions ont le type 'Prescription'
        const typedPrescriptions = prescriptions.map(p => ({ ...p, type: 'Prescription' as const }));
        
        // Fusionner avec les enregistrements existants, en remplaçant les anciennes prescriptions
        this.allRecords = [
          ...this.allRecords.filter(r => r.type !== 'Prescription'), // Enlever les anciennes prescriptions
          ...typedPrescriptions // Ajouter les nouvelles
        ];
        
        this.finalizeLoadingRecords();
      },
      error: (err) => {
        console.error('Error fetching prescriptions:', err);
        this.recordsError = 'Failed to load prescriptions. Please try again later.';
        this.isLoadingRecords = false;
        this.finalizeLoadingRecords(); // Appeler même en cas d'erreur pour initialiser les filtres
      }
    });
  }

  loadLabResults(): void {
    this.isLoadingRecords = true;
    this.recordsError = null;
    this.labResultService.getLabResults(this.patientId).subscribe({
      next: (labResults: Omit<MedicalRecordItem, 'type'>[]) => {
        const typedLabResults = labResults.map(lr => ({ ...lr, type: 'LabResult' as const }));

        this.allRecords = [
          ...this.allRecords.filter(r => r.type !== 'LabResult'),
          ...typedLabResults
        ];

        this.finalizeLoadingRecords();
      },
      error: (err: any) => {
        console.error('Error fetching lab results:', err);
        this.recordsError = 'Failed to load lab results. Please try again later.';
        this.isLoadingRecords = false;
        this.finalizeLoadingRecords();
      }
    });
  } 
  finalizeLoadingRecords(): void {
    this.populateAvailableDoctors();
    this.initializeAdvancedFilters();
    this.filterRecords(); // Appliquer les filtres initiaux
    this.isLoadingRecords = false;
    this.cdr.detectChanges();
  }

  initializeAdvancedFilters(): void {
    const currentSelectedTypes = { ...this.selectedRecordTypes };
    this.selectedRecordTypes = {};
    this.availableRecordTypes.forEach(type => {
        this.selectedRecordTypes[type] = currentSelectedTypes[type] !== undefined ? currentSelectedTypes[type] : true;
    });

    // Réinitialiser les docteurs sélectionnés
    const currentSelectedDoctors = { ...this.selectedDoctors };
    this.selectedDoctors = {};
    this.availableDoctors.forEach(doc => {
        this.selectedDoctors[doc] = currentSelectedDoctors[doc] !== undefined ? currentSelectedDoctors[doc] : true;
    });
  }

  setActiveTab(tabName: string): void {
    this.activeTab = tabName;
    this.closeAllDropdowns();
    // Re-filter records when tab changes
    // Data loading for each tab type happens in ngOnInit or could be triggered here if not already loaded
    this.filterRecords();
  }
  onSearchChange(): void {
    // La recherche ne s'applique que si l'onglet actif n'est pas MedicalHistory
    if (this.activeTab !== 'MedicalHistory') {
      this.filterRecords();
    }
  }
  toggleDateFilter(event: MouseEvent): void {
    event.stopPropagation();
    this.isAdvancedFilterOpen = false; // Ferme l'autre dropdown
    this.isDateFilterOpen = !this.isDateFilterOpen;
  }

  applyDateFilter(): void {
    if (this.activeTab !== 'MedicalHistory') {
      this.filterRecords();
    }
    this.isDateFilterOpen = false;
  }
  clearDateFilter(): void {
    this.dateFrom = '';
    this.dateTo = '';
    if (this.activeTab !== 'MedicalHistory') {
      this.filterRecords();
    }
    this.isDateFilterOpen = false;
  }
  toggleAdvancedFilter(event: MouseEvent): void {
    event.stopPropagation();
    this.isDateFilterOpen = false; // Ferme l'autre dropdown
    this.isAdvancedFilterOpen = !this.isAdvancedFilterOpen;
  }

  applyAdvancedFilters(): void {
    if (this.activeTab !== 'MedicalHistory') {
      this.filterRecords();
    }
    this.isAdvancedFilterOpen = false;
  }
  clearAdvancedFilters(): void {
    // Re-initialize filters to their default state (all true)
    this.availableRecordTypes.forEach(type => this.selectedRecordTypes[type] = true);
    this.availableDoctors.forEach(doc => this.selectedDoctors[doc] = true);
    
    if (this.activeTab !== 'MedicalHistory') {
      this.filterRecords();
    }
    this.isAdvancedFilterOpen = false;
  }

  closeAllDropdowns(): void {
    this.isDateFilterOpen = false;
    this.isAdvancedFilterOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as Node;
    // Ferme les dropdowns si le clic est à l'extérieur
    const dateFilterButton = document.querySelector('.btn-filter-date');
    const dateDropdown = document.querySelector('.date-filter-dropdown');
    const advancedFilterButton = document.querySelector('.btn-filter-advanced');
    const advancedDropdown = document.querySelector('.advanced-filter-dropdown');

    const clickedInsideDate = (dateFilterButton && dateFilterButton.contains(target)) || (dateDropdown && dateDropdown.contains(target));
    const clickedInsideAdvanced = (advancedFilterButton && advancedFilterButton.contains(target)) || (advancedDropdown && advancedDropdown.contains(target));

    if (!clickedInsideDate && !clickedInsideAdvanced) {
      this.closeAllDropdowns();
    }
  }
  filterRecords(): void {
    if (this.activeTab === 'MedicalHistory') {
      this.filteredRecords = []; // MedicalHistory a son propre affichage
      this.cdr.detectChanges();
      return;
    }

    let recordsToDisplay = [...this.allRecords];

    // 1. Filtre par onglet actif (pour les types d'enregistrements)
    recordsToDisplay = recordsToDisplay.filter(record => record.type === this.activeTab);
    
    // 2. Filtre par plage de dates
    if (this.dateFrom) {
      const fromDate = new Date(this.dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      recordsToDisplay = recordsToDisplay.filter(record => {
        const recordDateObj = new Date(record.recordDate);
        return recordDateObj >= fromDate;
      });
    }
    if (this.dateTo) {
      const toDate = new Date(this.dateTo);
      toDate.setHours(23, 59, 59, 999);
      recordsToDisplay = recordsToDisplay.filter(record => {
        const recordDateObj = new Date(record.recordDate);
        return recordDateObj <= toDate;
      });
    }
    
    // 3. Filtre par types d'enregistrements sélectionnés (depuis le dropdown "Filters")
    if (!this.selectedRecordTypes[this.activeTab as 'Prescription' | 'LabResult' | 'Image']) {
      recordsToDisplay = []; 
  }
  
    // 4. Filtre par médecins sélectionnés (depuis le dropdown "Filters")
    const activeSelectedDoctors = this.availableDoctors.filter(doc => this.selectedDoctors[doc]);
    if (activeSelectedDoctors.length < this.availableDoctors.length && activeSelectedDoctors.length > 0) { 
      recordsToDisplay = recordsToDisplay.filter(record => record.doctor && activeSelectedDoctors.includes(record.doctor));
    } else if (activeSelectedDoctors.length === 0 && this.availableDoctors.length > 0) { 
        recordsToDisplay = []; 
    }
    
    // 5. Filtre par terme de recherche
    if (this.searchTerm) {
      const lowerSearchTerm = this.searchTerm.toLowerCase();
      recordsToDisplay = recordsToDisplay.filter(record =>
        record.title.toLowerCase().includes(lowerSearchTerm) ||
        (record.doctor && record.doctor.toLowerCase().includes(lowerSearchTerm)) ||
        record.summary.toLowerCase().includes(lowerSearchTerm) ||
        (record.details && record.details.toLowerCase().includes(lowerSearchTerm))
      );
    }
    this.filteredRecords = recordsToDisplay;
    this.cdr.detectChanges();
  }

   
    openModal(record: MedicalRecordItem): void {
      this.selectedRecord = record;
      this.isModalOpen = true;
      this.closeAllDropdowns();
    }

  closeModal(): void {
    this.isModalOpen = false;
    this.selectedRecord = null;
  }

 
  downloadRecord(record: MedicalRecordItem | null): void {
    if (record) {
      // Logique de téléchargement à implémenter
      // Par exemple, créer un blob et un lien de téléchargement
      const recordData = JSON.stringify(record, null, 2);
      const blob = new Blob([recordData], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${record.title.replace(/\s+/g, '_')}_${record.id}.json`; // Nom de fichier suggéré
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      console.log(`Downloading record: ${record.title}`);
      // Ne fermez pas la modale ici, laissez l'utilisateur le faire s'il le souhaite
    }
  }
  exportRecords(): void {
    // Logique d'exportation à implémenter (par exemple, tous les filteredRecords)
    console.log('Exporting records...', this.filteredRecords);
    this.toastService.info('Exporting records functionality to be implemented.');
  }

  requestRecords(): void {
    // Logique de demande de dossiers à implémenter
    console.log('Requesting new records...');
    this.toastService.info('Requesting records functionality to be implemented.');
  }

  getRecordIconClass(type: MedicalRecordItem['type']): string {
    switch (type) {
      case 'LabResult': return 'fas fa-vial';
      case 'Image': return 'fas fa-x-ray';
      case 'Prescription': return 'fas fa-file-prescription';
      default: return 'fas fa-file-alt';
    }
  }
  
}
