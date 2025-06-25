
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { Prescription } from '../../../../../core/patient/domain/models/prescription.model';

type SortOrder = 'date-desc' | 'date-asc' | 'name-asc';
type StatusFilter = 'active' | 'completed' | 'cancelled' | 'all';

@Component({
  selector: 'app-prescription-list',
  standalone: false,
  templateUrl: './prescription-list.component.html',
  styleUrls: ['./prescription-list.component.css']
})
export class PrescriptionListComponent implements OnChanges {
  @Input() records: Prescription[] = [];
  @Output() viewRecordDetails = new EventEmitter<Prescription>();

  // Filtres et tri
  activeStatusFilter: StatusFilter = 'active';
  sortOrder: SortOrder = 'date-desc';
  
  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 3; // 6 cartes par page

  // Données
  private processedRecords: Prescription[] = []; // Liste complète, filtrée et triée
  displayedRecords: Prescription[] = []; // Liste paginée pour l'affichage

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['records']) {
      this.updatePipeline();
    }
  }

  updatePipeline(): void {
    let filtered = [...this.records];

    // 1. Filtrer par statut
    if (this.activeStatusFilter !== 'all') {
      filtered = filtered.filter(record => record.status === this.activeStatusFilter);
    }

    // 2. Trier
    filtered.sort((a, b) => {
      switch (this.sortOrder) {
        case 'date-asc':
          return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
        case 'name-asc':
          return a.medication_name.localeCompare(b.medication_name);
        case 'date-desc':
        default:
          return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
      }
    });

    this.processedRecords = filtered;
    this.applyPagination();
  }

  applyPagination(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.displayedRecords = this.processedRecords.slice(startIndex, endIndex);
  }

  setStatusFilter(status: StatusFilter): void {
    this.activeStatusFilter = status;
    this.currentPage = 1; // Revenir à la première page
    this.updatePipeline();
  }

  setSortOrder(order: SortOrder): void {
    this.sortOrder = order;
    this.currentPage = 1; // Revenir à la première page
    this.updatePipeline();
  }

  // --- Méthodes de pagination ---
  goToPage(page: number): void {
    if (page >= 1 && page <= this.getTotalPages()) {
      this.currentPage = page;
      this.applyPagination();
    }
  }

  getTotalPages(): number {
    if (!this.processedRecords || this.processedRecords.length === 0) {
      return 0;
    }
    return Math.ceil(this.processedRecords.length / this.itemsPerPage);
  }

  onViewDetails(record: Prescription): void {
    this.viewRecordDetails.emit(record);
  }

  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-status-success/10 text-status-success';
      case 'completed': return 'bg-gray-100 text-text-muted';
      case 'cancelled': return 'bg-status-urgent/10 text-status-urgent';
      default: return 'bg-status-info/10 text-status-info';
    }
  }

  trackByRecordId(index: number, record: Prescription): number {
    return record.id;
  }
}