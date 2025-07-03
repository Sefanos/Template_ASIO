import { ChangeDetectorRef, Component, HostListener, OnInit } from '@angular/core';
import { PrescriptionService } from '../../../core/patient/services/prescription-service.service';
import { ToastService } from '../../../shared/services/toast.service';
import { Prescription } from '../../../core/patient/domain/models/prescription.model';
import { PatientStatistics } from '../../../core/patient/domain/models/patient-statistics.model';
import { StatisticsService } from '../../../core/patient/services/statistics.service';
import { Alert } from '../../../core/patient/domain/models/alert.model';
import { AlertService } from '../../../core/patient/services/alert.service';
import { ActivatedRoute } from '@angular/router';
import { StatusFilter } from './components/prescription-list/prescription-list.component';
// L'ancienne interface ImageRecord est supprimée car les fichiers sont gérés par leur propre composant.
type MedicalRecord = Prescription & { type: 'Prescription' };

@Component({
  selector: 'app-medical-record',
  standalone: false,
  templateUrl: './medical-record.component.html',
  styleUrls: ['./medical-record.component.css']
})
export class MedicalRecordComponent implements OnInit {
  // L'onglet 'Image' est remplacé par 'Files'
  tabs: string[] = ['History', 'VitalSigns', 'LabResult', 'Files', 'Prescription', 'Notes'];
  activeTab: string = 'History';
  searchTerm: string = '';

  allRecords: MedicalRecord[] = [];
  filteredRecords: MedicalRecord[] = [];

  selectedRecord: any | null = null;
  isModalOpen: boolean = false;

  // Filtres
  isDateFilterOpen: boolean = false;
  dateFrom: string = '';
  dateTo: string = '';
  isAdvancedFilterOpen: boolean = false;
  availableDoctors: string[] = [];
  selectedDoctors: { [key: string]: boolean } = {};

  // Statistiques
  statistics: PatientStatistics | null = null;
  isLoadingStatistics: boolean = true;
  statisticsError: string | null = null;

  // Alertes
  alerts: Alert[] = [];
  filteredAlerts: Alert[] = [];
  isLoadingAlerts: boolean = true;
  alertsError: string | null = null;
  isAlertsDropdownOpen: boolean = false;
  // Filtres alertes
  alertStatusFilter: 'all' | 'active' | 'inactive' = 'all';
  alertTypeFilter: string = 'all';
  alertSeverityFilter: string = 'all';
  alertTypes: string[] = [];
  alertSeverities: string[] = ['critical', 'high', 'medium', 'low'];

  isLoadingRecords: boolean = false;
  recordsError: string | null = null;
  private patientId = 1;

  initialPrescriptionStatus: StatusFilter = 'active';
  
  // Pour l'affichage partiel des alertes
  showAllAlerts: boolean = false;
  maxAlertsToShow: number = 5;

  constructor(
    private prescriptionService: PrescriptionService,
    private statisticsService: StatisticsService,
    private alertService: AlertService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private toastService: ToastService
  ) { }

  ngOnInit(): void {
    this.loadAlerts();
    this.loadAllRecordTypes();
    this.loadStatistics();
      this.route.queryParams.subscribe(params => {
    if (params['tab'] && this.tabs.includes(params['tab'])) {
      this.setActiveTab(params['tab']);
    }
 if (params['status']) {
      this.initialPrescriptionStatus = params['status'];
    } else {
      this.initialPrescriptionStatus = 'active';
    }

  });
  }

  loadAlerts(): void {
    this.isLoadingAlerts = true;
    this.alertsError = null;
    this.alertService.getAllAlerts().subscribe({
      next: (data) => {
        this.alerts = data;
        this.alertTypes = Array.from(new Set(data.map(a => a.alert_type)));
        this.applyAlertFilters();
        this.isLoadingAlerts = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading alerts:', err);
        this.alertsError = 'Could not load patient alerts.';
        this.isLoadingAlerts = false;
        this.cdr.detectChanges();
      }
    });
  }

  applyAlertFilters(): void {
    this.filteredAlerts = this.alerts.filter(alert => {
      const statusOk = this.alertStatusFilter === 'all' || (this.alertStatusFilter === 'active' ? alert.is_active : !alert.is_active);
      const typeOk = this.alertTypeFilter === 'all' || alert.alert_type === this.alertTypeFilter;
      const severityOk = this.alertSeverityFilter === 'all' || alert.severity === this.alertSeverityFilter;
      return statusOk && typeOk && severityOk;
    });
  }

  setAlertStatusFilter(status: 'all' | 'active' | 'inactive') {
    this.alertStatusFilter = status;
    this.applyAlertFilters();
  }
  setAlertTypeFilter(type: string) {
    this.alertTypeFilter = type;
    this.applyAlertFilters();
  }
  setAlertSeverityFilter(severity: string) {
    this.alertSeverityFilter = severity;
    this.applyAlertFilters();
  }

  loadStatistics(): void {
    this.isLoadingStatistics = true;
    this.statisticsError = null;
    this.statisticsService.getPatientStatistics().subscribe({
      next: (data) => {
        this.statistics = data;
        this.isLoadingStatistics = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading statistics:', err);
        this.statisticsError = 'Could not load patient statistics.';
        this.isLoadingStatistics = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadAllRecordTypes(): void {
    this.isLoadingRecords = true;
    this.recordsError = null;
    this.allRecords = [];

    // On ne charge plus que les prescriptions, les fichiers sont autonomes.
    Promise.all([
      this.fetchPrescriptions()
    ]).then(() => {
      this.finalizeLoadingRecords();
    }).catch(error => {
      console.error("Error loading records:", error);
      this.recordsError = "Failed to load some records. Please try again.";
      this.isLoadingRecords = false;
      this.cdr.detectChanges();
    });
  }

  private fetchPrescriptions(): Promise<void> {
    return new Promise((resolve) => {
      this.prescriptionService.getPrescriptions(this.patientId).subscribe({
        next: (data) => {
          const prescriptionsWithType = data.map(p => ({ ...p, type: 'Prescription' as const }));
          this.allRecords.push(...prescriptionsWithType);
          resolve();
        },
        error: (err) => { console.error('Error loading prescriptions:', err); resolve(); }
      });
    });
  }

  finalizeLoadingRecords(): void {
    this.populateAvailableDoctors();
    this.initializeAdvancedFilters();
    // this.setActiveTab('History');
    this.isLoadingRecords = false;
    this.cdr.detectChanges();
  }

  populateAvailableDoctors(): void {
    const doctors = new Set<string>();
    this.allRecords.forEach(record => {
      const doctorName = (record as Prescription).doctor?.name;
      if (doctorName) doctors.add(doctorName);
    });
    this.availableDoctors = Array.from(doctors).sort();
  }

  initializeAdvancedFilters(): void {
    this.selectedDoctors = {};
    this.availableDoctors.forEach(doc => { this.selectedDoctors[doc] = true; });
  }

  setActiveTab(tabName: string): void {
    this.activeTab = tabName;
    this.closeAllDropdowns();
    if (this.activeTab === 'Prescription') {
      this.filterRecords();
    } else {
      this.filteredRecords = [];
    }
  }

  onSearchChange(): void {
    if (this.activeTab === 'Prescription') {
      this.filterRecords();
    }
  }

  filterRecords(): void {
    if (this.activeTab !== 'Prescription') {
      this.filteredRecords = [];
      return;
    }

    let records = this.allRecords.filter(r => r.type === this.activeTab);

    if (this.dateFrom) {
      const from = new Date(this.dateFrom).getTime();
      records = records.filter(r => new Date(r.start_date).getTime() >= from);
    }
    if (this.dateTo) {
      const to = new Date(this.dateTo).getTime();
      records = records.filter(r => new Date(r.start_date).getTime() <= to);
    }

    const activeDoctors = this.availableDoctors.filter(doc => this.selectedDoctors[doc]);
    if (activeDoctors.length < this.availableDoctors.length) {
      records = records.filter(r => {
        const doctor = r.doctor?.name;
        return doctor && activeDoctors.includes(doctor);
      });
    }

    if (this.searchTerm) {
      const lowerSearch = this.searchTerm.toLowerCase();
      records = records.filter(r => {
        const title = r.medication_name || '';
        const summary = r.instructions || '';
        const provider = r.doctor?.name || '';
        return title.toLowerCase().includes(lowerSearch) ||
               summary.toLowerCase().includes(lowerSearch) ||
               provider.toLowerCase().includes(lowerSearch);
      });
    }

    this.filteredRecords = records;
    this.cdr.detectChanges();
  }

  openModal(record: any): void {
    if (!record || record.type !== 'Prescription') return;

    const pres = record as Prescription;
    this.selectedRecord = {
      type: 'Prescription',
      title: pres.medication_name,
      recordDate: pres.start_date,
      doctor: pres.doctor.name,
      details: `Status: ${pres.status}\nDosage: ${pres.dosage}\nFrequency: ${pres.frequency}\nDuration: ${pres.duration}\nRefills Allowed: ${pres.refills_allowed}\n\nInstructions:\n${pres.instructions}`
    };
    this.isModalOpen = true;
  }

  closeModal(): void { this.isModalOpen = false; this.selectedRecord = null; }
  downloadRecord(record: any | null): void { this.toastService.info('Download functionality to be implemented.'); }
  
  getRecordIconClass(type: string): string {
    switch (type) {
      case 'Prescription': return 'fas fa-prescription-bottle-alt';
      case 'Files': return 'fas fa-folder-open';
      case 'LabResult': return 'fas fa-vial';
      case 'History': return 'fas fa-file-medical-alt';
      default: return 'fas fa-file';
    }
  }

  getAlertIconAndColor(severity: string): { icon: string, colorClass: string } {
    switch (severity) {
      case 'critical': return { icon: 'fas fa-star-of-life', colorClass: 'text-status-urgent' };
      case 'high': return { icon: 'fas fa-exclamation-triangle', colorClass: 'text-status-urgent' };
      case 'medium': return { icon: 'fas fa-exclamation-circle', colorClass: 'text-status-warning' };
      default: return { icon: 'fas fa-info-circle', colorClass: 'text-status-info' };
    }
  }

  @HostListener('document:click', ['$event']) onDocumentClick(event: Event): void { this.closeAllDropdowns(); }
  toggleDateFilter(event: MouseEvent): void { event.stopPropagation(); this.isAdvancedFilterOpen = false; this.isAlertsDropdownOpen = false; this.isDateFilterOpen = !this.isDateFilterOpen; }
  applyDateFilter(): void { this.filterRecords(); this.isDateFilterOpen = false; }
  clearDateFilter(): void { this.dateFrom = ''; this.dateTo = ''; this.filterRecords(); this.isDateFilterOpen = false; }
  toggleAdvancedFilter(event: MouseEvent): void { event.stopPropagation(); this.isDateFilterOpen = false; this.isAlertsDropdownOpen = false; this.isAdvancedFilterOpen = !this.isAdvancedFilterOpen; }
  applyAdvancedFilters(): void { this.filterRecords(); this.isAdvancedFilterOpen = false; }
  clearAdvancedFilters(): void { this.initializeAdvancedFilters(); this.filterRecords(); this.isAdvancedFilterOpen = false; }
  toggleAlertsDropdown(event: MouseEvent): void { event.stopPropagation(); this.isDateFilterOpen = false; this.isAdvancedFilterOpen = false; this.isAlertsDropdownOpen = !this.isAlertsDropdownOpen; }
  closeAllDropdowns(): void { this.isDateFilterOpen = false; this.isAdvancedFilterOpen = false; this.isAlertsDropdownOpen = false; }

  get alertsToDisplay(): Alert[] {
    return this.showAllAlerts ? this.filteredAlerts : this.filteredAlerts.slice(0, this.maxAlertsToShow);
  }
  toggleShowAllAlerts(): void {
    this.showAllAlerts = !this.showAllAlerts;
  }
}
