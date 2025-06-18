import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { PatientService } from '../../../shared/services/patient.service';
import { DoctorPatientService, MyPatient, AllPatient, PatientSearchFilters } from '../../../services/doc-services/doctor-patient.service';
import { PatientSearchFilterComponent } from '../../../components/doc_components/patient-management/patient-search-filter/patient-search-filter.component';
import { PatientListTableComponent, PatientTableRow } from '../../../components/doc_components/patient-management/patient-list-table/patient-list-table.component';
import { Patient } from '../../../models/patient.model';

@Component({
  selector: 'app-patient-management',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    PatientSearchFilterComponent, 
    PatientListTableComponent
  ],
  templateUrl: './patient-management.component.html',
  styleUrl: './patient-management.component.css'
})
export class PatientManagementComponent implements OnInit, OnDestroy {
  // Force recompilation - fixed JIT compilation issue
  private destroy$ = new Subject<void>();
  
  // ✅ Tab Management
  activeTab: 'my-patients' | 'all-patients' = 'my-patients';
  
  // ✅ Data Storage (current page data)
  myPatients: MyPatient[] = [];
  allPatients: AllPatient[] = [];
    // ✅ Backend Pagination Info
  myPatientsPagination = {
    current_page: 1,
    last_page: 1,
    per_page: 20,
    total: 0,
    from: 1,
    to: 20
  };
  
  allPatientsPagination = {
    current_page: 1,
    last_page: 1,
    per_page: 20,
    total: 0,
    from: 1,
    to: 20
  };
  
  // ✅ Search and Filters (applied on backend)
  searchQuery: string = '';
  filters: PatientSearchFilters = {
    status: '',
    gender: '',
    ageRange: [0, 100]
  };
  
  // ✅ Displayed Data (current page, filtered)
  displayedPatients: PatientTableRow[] = [];
  
  // ✅ Loading States
  isLoading = {
    myPatients: false,
    allPatients: false
  };
  
  // ✅ Pagination (UI pagination - matches backend)
  currentPage = 1;
  pageSize = 20;
  totalPages = 1;
  maxPagesToShow = 5;
  
  // ✅ UI State
  expandedRows = new Set<number>();
  
  // ✅ Flags for initialization
  private myPatientsLoaded = false;
  private allPatientsLoaded = false;

  constructor(
    private router: Router, 
    private patientService: PatientService,
    private doctorPatientService: DoctorPatientService
  ) {}
  
  ngOnInit(): void {
    // Load my patients immediately (most common use case)
    this.loadMyPatients();
    
    // Subscribe to loading states
    this.doctorPatientService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => {
        this.isLoading = loading;
      });
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  // ✅ Tab Management Methods
  switchTab(tab: 'my-patients' | 'all-patients'): void {
    this.activeTab = tab;
    this.currentPage = 1; // Reset pagination
    this.searchQuery = ''; // Reset search
    this.filters = { status: '', gender: '', ageRange: [0, 100] }; // Reset filters
    
    if (tab === 'my-patients') {
      this.loadMyPatients();
    } else {
      this.loadAllPatients();
    }
  }
    // ✅ Data Loading Methods with Backend Pagination
  loadMyPatients(page: number = 1): void {
    this.doctorPatientService.getMyPatients(page, this.pageSize)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.myPatients = result.patients;
          this.myPatientsPagination = result.pagination;
          this.myPatientsLoaded = true;
          this.updateDisplayedPatients();
        },
        error: (error) => {
          console.error('Error loading my patients:', error);
        }
      });
  }
  
  loadAllPatients(page: number = 1): void {
    this.doctorPatientService.getAllPatients(page, this.pageSize)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.allPatients = result.patients;
          this.allPatientsPagination = result.pagination;
          this.allPatientsLoaded = true;
          this.updateDisplayedPatients();
        },
        error: (error) => {
          console.error('Error loading all patients:', error);
        }
      });
  }
  
  // ✅ Update Displayed Patients (applies frontend filtering to current page)
  updateDisplayedPatients(): void {
    let patients: PatientTableRow[] = [];
    
    if (this.activeTab === 'my-patients') {
      // Apply frontend filtering to current page of my patients
      const filtered = this.applyFrontendFilters(this.myPatients, 'my-patients');
      patients = filtered.map(patient => this.mapMyPatientToTableRow(patient));
      
      // Update pagination info
      this.currentPage = this.myPatientsPagination.current_page;
      this.totalPages = this.myPatientsPagination.last_page;
    } else {
      // Apply frontend filtering to current page of all patients
      const filtered = this.applyFrontendFilters(this.allPatients, 'all-patients');
      patients = filtered.map(patient => this.mapAllPatientToTableRow(patient));
      
      // Update pagination info
      this.currentPage = this.allPatientsPagination.current_page;
      this.totalPages = this.allPatientsPagination.last_page;
    }
    
    this.displayedPatients = patients;
  }
  
  // ✅ Apply Frontend Filters (search within current page)
  applyFrontendFilters(patients: any[], type: 'my-patients' | 'all-patients'): any[] {
    return patients.filter(patient => {
      // Text search
      const searchTerm = this.searchQuery.toLowerCase();
      const matchesSearch = !searchTerm || 
        (type === 'my-patients' ? patient.fullName : patient.name).toLowerCase().includes(searchTerm) ||
        patient.user?.email?.toLowerCase().includes(searchTerm) ||
        patient.email?.toLowerCase().includes(searchTerm) ||
        patient.user?.phone?.includes(searchTerm) ||
        patient.phone?.includes(searchTerm);
      
      // Status filter
      const matchesStatus = !this.filters.status || 
        (patient.user?.status || patient.status) === this.filters.status;
      
      // Gender filter (only for my patients)
      const matchesGender = type === 'all-patients' || !this.filters.gender || 
        patient.personal_info?.gender === this.filters.gender;
      
      // Age range filter (only for my patients)
      const matchesAge = type === 'all-patients' || !this.filters.ageRange || 
        (patient.age >= this.filters.ageRange[0] && patient.age <= this.filters.ageRange[1]);
      
      return matchesSearch && matchesStatus && matchesGender && matchesAge;
    });
  }
    // ✅ Search and Filter Methods
  onSearchChange(): void {
    // For backend pagination, we need to reload current page with search
    this.reloadCurrentPage();
  }
  
  onFiltersChange(filters: PatientSearchFilters): void {
    this.filters = filters;
    // For backend pagination, we need to reload current page with filters
    this.reloadCurrentPage();
  }
  
  // ✅ Reload current page (when search/filters change)
  reloadCurrentPage(): void {
    if (this.activeTab === 'my-patients') {
      this.loadMyPatients(this.currentPage);
    } else {
      this.loadAllPatients(this.currentPage);
    }
  }
  
  // ✅ Data Transformation Methods
  mapMyPatientToTableRow(patient: MyPatient): PatientTableRow {
    return {
      id: patient.id.toString(),
      name: patient.fullName,
      email: patient.user.email,
      phone: patient.user.phone,
      status: this.formatStatus(patient.user.status),
      lastVisit: patient.lastVisit || 'Never',
      age: patient.age,
      appointmentsInfo: `${patient.total_appointments} total (${patient.upcoming_appointments} upcoming)`,
      hasAlerts: patient.critical_alerts_count > 0,
      alertsCount: patient.critical_alerts_count,
      // Rich data for expandable row
      expandedData: {
        personalInfo: patient.personal_info,
        registrationDate: patient.registration_date,
        totalAppointments: patient.total_appointments,
        upcomingAppointments: patient.upcoming_appointments,
        criticalAlerts: patient.critical_alerts_count
      }
    };
  }
  
  mapAllPatientToTableRow(patient: AllPatient): PatientTableRow {
    return {
      id: patient.id.toString(),
      name: patient.name,
      email: patient.email,
      phone: patient.phone,
      status: this.formatStatus(patient.status),
      lastVisit: 'Unknown', // Not available in basic data
      age: patient.age || 0,
      appointmentsInfo: 'View Details', // Not available in basic data
      hasAlerts: false, // Not available in basic data
      alertsCount: 0,
      // Basic data for expandable row
      expandedData: {
        registrationDate: patient.registrationDate,
        readOnly: true // Mark as read-only
      }
    };
  }
  
  formatStatus(status: string): string {
    switch (status.toLowerCase()) {
      case 'active': return 'Active';
      case 'inactive': return 'Inactive';
      case 'suspended': return 'Suspended';
      default: return status;
    }
  }
    // ✅ Pagination Methods
  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      if (this.activeTab === 'my-patients') {
        this.loadMyPatients(page);
      } else {
        this.loadAllPatients(page);
      }
    }
  }
  
  get pagesToShow(): number[] {
    const pages: number[] = [];
    const start = Math.max(1, this.currentPage - Math.floor(this.maxPagesToShow / 2));
    const end = Math.min(this.totalPages, start + this.maxPagesToShow - 1);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }
  
  // ✅ Row Expansion Methods
  toggleRowExpansion(patientId: string): void {
    const id = parseInt(patientId);
    if (this.expandedRows.has(id)) {
      this.expandedRows.delete(id);
    } else {
      this.expandedRows.add(id);
    }
  }
  
  isRowExpanded(patientId: string): boolean {
    return this.expandedRows.has(parseInt(patientId));
  }
  
  // ✅ Action Methods
  viewPatient(patientId: string): void {
    if (this.activeTab === 'my-patients') {
      // Navigate to full patient details (doctor has full access)
      this.router.navigate(['/doctor/patients', patientId]);
    } else {
      // Show read-only modal for non-assigned patients
      this.showPatientDetailsModal(parseInt(patientId));
    }
  }
  
  showPatientDetailsModal(patientId: number): void {
    // This would open a modal with read-only patient details
    // For now, just log - you can implement modal later
    console.log('Show read-only details for patient:', patientId);
    
    this.doctorPatientService.getPatientDetails(patientId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (details) => {
          console.log('Patient details:', details);
          // Here you would open a modal with the details
        },
        error: (error) => {
          console.error('Error loading patient details:', error);
        }
      });
  }
  
  messagePatient(patientId: string): void {
    // Only available for my patients
    if (this.activeTab === 'my-patients') {
      console.log('Message patient:', patientId);
      // Implement messaging functionality
    }
  }
  exportPatientData(): void {
    // Export ALL data, not just current page
    if (this.activeTab === 'my-patients') {
      this.exportMyPatients();
    } else {
      this.exportAllPatients();
    }
  }
  
  private exportMyPatients(): void {
    // Get ALL my patients data (not just current page)
    this.doctorPatientService.getMyPatients(1, 10000) // Get up to 10k patients
      .subscribe({
        next: (result) => {
          const data = result.patients.map(patient => ({
            'Patient Name': patient.fullName,
            'Age': patient.age,
            'Phone': patient.user.phone,
            'Email': patient.user.email,
            'Status': patient.user.status,
            'Gender': patient.personal_info?.gender || 'N/A',
            'Birth Date': patient.personal_info?.birthdate || 'N/A',
            'Total Appointments': patient.total_appointments,
            'Last Visit': patient.lastVisit,
            'Registration Date': new Date(patient.created_at).toLocaleDateString()
          }));
          
          this.downloadExcel(data, `my-patients-${new Date().toISOString().split('T')[0]}.xlsx`);
        },
        error: (error) => {
          console.error('Error exporting my patients:', error);
        }
      });
  }
  
  private exportAllPatients(): void {
    // Get ALL system patients data (not just current page)
    this.doctorPatientService.getAllPatients(1, 10000) // Get up to 10k patients
      .subscribe({
        next: (result) => {
          const data = result.patients.map(patient => ({
            'Patient Name': patient.name,
            'Phone': patient.phone,
            'Email': patient.email,
            'Status': patient.status,
            'Registration Date': new Date(patient.created_at).toLocaleDateString()
          }));
          
          this.downloadExcel(data, `all-patients-${new Date().toISOString().split('T')[0]}.xlsx`);
        },
        error: (error) => {
          console.error('Error exporting all patients:', error);
        }
      });
  }
  
  private downloadExcel(data: any[], filename: string): void {
    // Create Excel-compatible CSV
    const headers = Object.keys(data[0] || {});
    const csvContent = [
      headers.join(','), // Header row
      ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename.replace('.xlsx', '.csv'));
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  
  // ✅ Refresh Methods
  refreshCurrentTab(): void {
    if (this.activeTab === 'my-patients') {
      this.myPatientsLoaded = false;
      this.loadMyPatients(this.currentPage);
    } else {
      this.allPatientsLoaded = false;
      this.loadAllPatients(this.currentPage);
    }
  }

  // ✅ Legacy Methods (for backward compatibility with existing components)
  updateSearch(query: string): void {
    this.searchQuery = query;
    this.onSearchChange();
  }

  updateFilters(filters: any): void {
    // Convert old filter format to new format if needed
    this.onFiltersChange(this.filters);
  }
}
