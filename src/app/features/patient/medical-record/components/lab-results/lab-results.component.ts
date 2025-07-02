import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { LabResult, PaginatedLabResultData } from '../../../../../core/patient/domain/models/lab-result.model';
import { LabResultService } from '../../../../../core/patient/services/lab-result-service.service';
import { Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, catchError } from 'rxjs/operators';

@Component({
  selector: 'app-lab-results',
  templateUrl: './lab-results.component.html',
  styleUrls: ['./lab-results.component.css'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LabResultsComponent implements OnInit {
  isLoading: boolean = true;
  errorMessage: string | null = null;
  
  paginatedData: PaginatedLabResultData | null = null;
  displayRecords: LabResult[] = [];
  
  // Vue et affichage
  viewMode: 'grid' | 'list' = 'grid';
  
  sortOrder: 'desc' | 'asc' = 'desc';
  statusFilter: string = 'all';
  availableStatuses: string[] = ['all', 'abnormal', 'normal', 'reviewed', 'pending_review', 'requires_action'];
  testNameFilter: string = '';
  private searchSubject = new Subject<string>();
  currentPage: number = 1;
  itemsPerPage: number = 3;

  constructor(
    private labResultService: LabResultService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.itemsPerPage = 5;
    this.loadLabResults();
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(() => {
      this.currentPage = 1;
      this.loadLabResults();
    });
  }

  // === MÉTHODES DE GESTION DES VUES ===

  /**
   * Change le mode d'affichage entre grille et liste
   */
  setViewMode(mode: 'grid' | 'list'): void {
    this.viewMode = mode;
    this.cdr.detectChanges();
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadLabResults();
  }

  onSearchChange(): void {
    this.searchSubject.next(this.testNameFilter);
  }

  loadLabResults(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.cdr.detectChanges();

    this.labResultService.getPatientLabResults(
      this.currentPage, this.itemsPerPage, this.sortOrder, this.statusFilter, this.testNameFilter
    ).pipe(
      catchError(err => {
        this.errorMessage = "Failed to load lab results. Please try again later.";
        this.isLoading = false;
        console.error(err);
        this.cdr.detectChanges();
        return of(null);
      })
    ).subscribe(data => {
      if (data) {
        this.paginatedData = data;
        this.displayRecords = data.data;
        this.itemsPerPage = data.per_page;
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // --- Fonctions Utilitaires pour l'UI ---

  getRangeInfo(value: number | string, range: string): { status: 'low' | 'normal' | 'high' | 'unknown', colorClass: string, positionPercent: number } {
    if (typeof range !== 'string' || !range.includes('-')) {
      return { status: 'unknown', colorClass: 'text-gray-800', positionPercent: 50 };
    }

    const numericValue = typeof value === 'string' ? parseFloat(value) : value;
    const [min, max] = range.split('-').map(Number);

    if (isNaN(numericValue) || isNaN(min) || isNaN(max)) {
      return { status: 'unknown', colorClass: 'text-gray-800', positionPercent: 50 };
    }

    let status: 'low' | 'normal' | 'high' = 'normal';
    let colorClass = 'text-green-600';

    if (numericValue < min) {
      status = 'low';
      colorClass = 'text-blue-600';
    } else if (numericValue > max) {
      status = 'high';
      colorClass = 'text-red-600';
    }

    const rangeWidth = max - min;
    const visualMin = min - (rangeWidth * 0.25);
    const visualMax = max + (rangeWidth * 0.25);
    const totalVisualRange = visualMax - visualMin;

    if (totalVisualRange <= 0) {
      return { status, colorClass, positionPercent: 50 };
    }

    const position = ((numericValue - visualMin) / totalVisualRange) * 100;
    const positionPercent = Math.max(0, Math.min(100, position));

    return { status, colorClass, positionPercent };
  }

  getOverallStatusInfo(status: string | undefined): { text: string, icon: string, colorClass: string } {
    if (!status) status = 'normal';
    switch (status.toLowerCase()) {
      case 'abnormal': return { text: 'Abnormal', icon: 'fas fa-exclamation-triangle', colorClass: 'text-red-500' };
      case 'normal': return { text: 'Normal', icon: 'fas fa-check-circle', colorClass: 'text-green-500' };
      default: return { text: 'Normal', icon: 'fas fa-check-circle', colorClass: 'text-green-500' };
    }
  }

  // NOUVELLE FONCTION : Retourne une icône basée sur le nom du test
  getTestTypeIcon(testName: string | undefined): string {
    if (!testName) return 'fa-vial';
    const lower = testName.toLowerCase();
    if (lower.includes('blood') || lower.includes('cbc')) return 'fa-tint';
    if (lower.includes('lipid') || lower.includes('cholesterol')) return 'fa-heartbeat';
    if (lower.includes('thyroid') || lower.includes('tsh')) return 'fa-dna';
    if (lower.includes('vitamin')) return 'fa-pills';
    if (lower.includes('glucose')) return 'fa-chart-line';
    return 'fa-vial';
  }

  goToPage(page: number | string): void {
    if (typeof page !== 'number') return;
    if (page >= 1 && page <= (this.paginatedData?.last_page || 1) && page !== this.currentPage) {
      this.currentPage = page;
      this.loadLabResults();
      window.scrollTo(0, 0);
    }
  }

  getPaginationModel(): (number | string)[] {
    if (!this.paginatedData || this.paginatedData.last_page <= 1) return [];
    const { current_page, last_page } = this.paginatedData;
    if (last_page <= 7) return Array.from({ length: last_page }, (_, i) => i + 1);
    if (current_page <= 4) return [1, 2, 3, 4, 5, '...', last_page];
    if (current_page >= last_page - 3) return [1, '...', last_page - 4, last_page - 3, last_page - 2, last_page - 1, last_page];
    return [1, '...', current_page - 1, current_page, current_page + 1, '...', last_page];
  }

  trackByRecordId(index: number, record: LabResult): number {
    return record.id;
  }

  // === NOUVELLES MÉTHODES POUR LA PAGINATION AMÉLIORÉE ===

  /**
   * Retourne les pages visibles autour de la page actuelle
   */
  getVisiblePages(): number[] {
    if (!this.paginatedData) return [];
    
    const { current_page, last_page } = this.paginatedData;
    const pages: number[] = [];
    
    // Logique pour afficher 2 pages avant et après la page actuelle
    const start = Math.max(1, current_page - 2);
    const end = Math.min(last_page, current_page + 2);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  /**
   * Gère le changement du nombre d'éléments par page
   */
  onItemsPerPageChange(): void {
    this.currentPage = 1;
    this.loadLabResults();
  }
}