// import { Component, OnInit } from '@angular/core';
// import { MedicalHistoryService } from '../../../../../core/patient/services/medical-history.service';
// import { MedicalHistoryRecord, MedicalHistorySummary } from '../../../../../core/patient/domain/models/medical-history.model';
// import { ToastService } from '../../../../../shared/services/toast.service';

// interface SummaryCard {
//   key: 'conditions' | 'chronic' | 'surgeries' | 'medications' | 'allergies';
//   title: string;
//   count: number;
//   icon: string;
//   colorClass: string;
// }

// @Component({
//   selector: 'app-medical-history',
//   templateUrl: './medical-history.component.html',
//   standalone: false,
//   styleUrls: ['./medical-history.component.css']
// })
// export class MedicalHistoryComponent implements OnInit {
//   isLoading: boolean = true;
//   errorMessage: string | null = null;

//   allRecords: MedicalHistoryRecord[] = [];
//   filteredRecords: MedicalHistoryRecord[] = [];

//   summaryCards: SummaryCard[] = [
//     { key: 'conditions', title: 'Conditions', count: 0, icon: 'fas fa-procedures', colorClass: 'text-blue-500' },
//     { key: 'chronic', title: 'Chronic', count: 0, icon: 'fas fa-stopwatch-20', colorClass: 'text-purple-500' },
//     { key: 'surgeries', title: 'Surgeries', count: 0, icon: 'fas fa-cut', colorClass: 'text-gray-600' },
//     { key: 'medications', title: 'Medications', count: 0, icon: 'fas fa-pills', colorClass: 'text-yellow-500' },
//     { key: 'allergies', title: 'Allergies', count: 0, icon: 'fas fa-exclamation-triangle', colorClass: 'text-red-500' }
//   ];

//   filters = [
//     { key: 'all', label: 'All Sections' },
//     { key: 'conditions', label: 'Conditions' },
//     { key: 'chronic', label: 'Chronic' },
//     { key: 'surgeries', label: 'Surgeries' },
//     { key: 'medications', label: 'Medications' },
//     { key: 'allergies', label: 'Allergies' }
//   ];
//   activeFilter: string = 'all';

//   constructor(
//     private medicalHistoryService: MedicalHistoryService,
//     private toastService: ToastService
//   ) {}

//   ngOnInit(): void {
//     this.loadMedicalHistory();
//     this.loadSummaryStatistics();
//   }

//   loadSummaryStatistics(): void {
//     this.medicalHistoryService.getMedicalHistorySummary().subscribe({
//       next: (summaryData) => {
//         this.updateSummaryCards(summaryData);
//       },
//       error: (err) => {
//         this.toastService.error('Could not load summary statistics.');
//         console.error('Error loading summary statistics:', err);
//       }
//     });
//   }

//   updateSummaryCards(summaryData: MedicalHistorySummary): void {
//     this.summaryCards.forEach(card => {
//       switch (card.key) {
//         case 'conditions':
//           card.count = summaryData.conditions;
//           break;
//         case 'chronic':
//           card.count = summaryData.chronic;
//           break;
//         case 'surgeries':
//           card.count = summaryData.surgeries;
//           break;
//         case 'medications':
//           card.count = summaryData.active_medications;
//           break;
//         case 'allergies':
//           card.count = summaryData.allergies;
//           break;
//       }
//     });
//   }

//   loadMedicalHistory(): void {
//     this.isLoading = true;
//     this.errorMessage = null;
//     this.medicalHistoryService.getMedicalHistoryRecords().subscribe({
//       next: (records) => {
//         this.allRecords = records;
//         this.applyFilter();
//         this.isLoading = false;
//       },
//       error: (err) => {
//         this.errorMessage = err.message || 'An unknown error occurred.';
//         this.isLoading = false;
//       }
//     });
//   }

//   setFilter(filterKey: string): void {
//     this.activeFilter = filterKey;
//     this.applyFilter();
//   }

//   applyFilter(): void {
//     if (this.activeFilter === 'all') {
//       this.filteredRecords = this.allRecords;
//       return;
//     }

//     this.filteredRecords = this.allRecords.filter(record => {
//       switch (this.activeFilter) {
//         case 'conditions': return record.current_medical_conditions.length > 0;
//         case 'chronic': return record.chronic_diseases.length > 0;
//         case 'surgeries': return record.past_surgeries.length > 0;
//         case 'medications': return record.current_medications.length > 0;
//         case 'allergies': return record.allergies.length > 0;
//         default: return true;
//       }
//     });
//   }

//   refreshData(): void {
//     this.toastService.info('Refreshing medical history...');
//     this.loadMedicalHistory();
//     this.loadSummaryStatistics();
//   }

//   hasData(record: MedicalHistoryRecord): boolean {
//     return record.current_medical_conditions.length > 0 ||
//            record.chronic_diseases.length > 0 ||
//            record.past_surgeries.length > 0 ||
//            record.current_medications.length > 0 ||
//            record.allergies.length > 0;
//   }
// }





import { Component, OnInit } from '@angular/core';
import { MedicalHistoryService } from '../../../../../core/patient/services/medical-history.service';
import { MedicalHistoryRecord, MedicalHistorySummary } from '../../../../../core/patient/domain/models/medical-history.model';
import { ToastService } from '../../../../../shared/services/toast.service';

interface SummaryCard {
  key: 'conditions' | 'chronic' | 'surgeries' | 'medications' | 'allergies';
  title: string;
  count: number;
  icon: string;
  colorClass: string;
}

@Component({
  selector: 'app-medical-history',
  templateUrl: './medical-history.component.html',
  standalone: false,
  styleUrls: ['./medical-history.component.css']
})
export class MedicalHistoryComponent implements OnInit {
  isLoading: boolean = true;
  errorMessage: string | null = null;

  // Aggregated data properties for a consolidated view
  allConditions: string[] = [];
  allChronicDiseases: string[] = [];
  allPastSurgeries: string[] = [];
  allCurrentMedications: string[] = [];
  allAllergies: string[] = [];

  summaryCards: SummaryCard[] = [
    { key: 'conditions', title: 'Conditions', count: 0, icon: 'fas fa-procedures', colorClass: 'text-blue-500' },
    { key: 'chronic', title: 'Chronic', count: 0, icon: 'fas fa-stopwatch-20', colorClass: 'text-purple-500' },
    { key: 'surgeries', title: 'Surgeries', count: 0, icon: 'fas fa-cut', colorClass: 'text-gray-600' },
    { key: 'medications', title: 'Medications', count: 0, icon: 'fas fa-pills', colorClass: 'text-yellow-500' },
    { key: 'allergies', title: 'Allergies', count: 0, icon: 'fas fa-exclamation-triangle', colorClass: 'text-red-500' }
  ];

  constructor(
    private medicalHistoryService: MedicalHistoryService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadMedicalHistory();
    this.loadSummaryStatistics();
  }

  loadSummaryStatistics(): void {
    this.medicalHistoryService.getMedicalHistorySummary().subscribe({
      next: (summaryData) => {
        this.updateSummaryCards(summaryData);
      },
      error: (err) => {
        this.toastService.error('Could not load summary statistics.');
        console.error('Error loading summary statistics:', err);
      }
    });
  }

  updateSummaryCards(summaryData: MedicalHistorySummary): void {
    this.summaryCards.forEach(card => {
      switch (card.key) {
        case 'conditions': card.count = summaryData.conditions; break;
        case 'chronic': card.count = summaryData.chronic; break;
        case 'surgeries': card.count = summaryData.surgeries; break;
        case 'medications': card.count = summaryData.active_medications; break;
        case 'allergies': card.count = summaryData.allergies; break;
      }
    });
  }

  loadMedicalHistory(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.medicalHistoryService.getMedicalHistoryRecords().subscribe({
      next: (records) => {
        this.processAndAggregateRecords(records);
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err.message || 'An unknown error occurred.';
        this.isLoading = false;
      }
    });
  }

  /**
   * Processes all records to create consolidated, unique lists for display.
   */
  processAndAggregateRecords(records: MedicalHistoryRecord[]): void {
    const conditionsSet = new Set<string>();
    const chronicSet = new Set<string>();
    const surgeriesSet = new Set<string>();
    const medicationsSet = new Set<string>();
    const allergiesSet = new Set<string>();

    records.forEach(record => {
      record.current_medical_conditions.forEach(item => conditionsSet.add(item));
      record.chronic_diseases.forEach(item => chronicSet.add(item));
      record.past_surgeries.forEach(item => surgeriesSet.add(item));
      record.current_medications.forEach(item => medicationsSet.add(item));
      record.allergies.forEach(item => allergiesSet.add(item));
    });

    this.allConditions = Array.from(conditionsSet);
    this.allChronicDiseases = Array.from(chronicSet);
    this.allPastSurgeries = Array.from(surgeriesSet);
    this.allCurrentMedications = Array.from(medicationsSet);
    this.allAllergies = Array.from(allergiesSet);
  }

  refreshData(): void {
    this.toastService.info('Refreshing medical history...');
    this.loadMedicalHistory();
    this.loadSummaryStatistics();
  }

  hasAnyData(): boolean {
    return this.allConditions.length > 0 ||
           this.allChronicDiseases.length > 0 ||
           this.allPastSurgeries.length > 0 ||
           this.allCurrentMedications.length > 0 ||
           this.allAllergies.length > 0;
  }
}