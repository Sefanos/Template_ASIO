import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, OnInit } from '@angular/core';
import { Prescription } from '../../../../../core/patient/domain/models/prescription.model';

export type StatusFilter = 'active' | 'completed' | 'cancelled' | 'all';
type SortOrder = 'date-desc' | 'date-asc' | 'name-asc';

@Component({
  selector: 'app-prescription-list',
  standalone: false,
  templateUrl: './prescription-list.component.html',
  styleUrls: ['./prescription-list.component.css']
})
export class PrescriptionListComponent implements OnChanges, OnInit {
  @Input() records: Prescription[] = [];
  @Input() loading: boolean = false;
  @Input() initialStatus: StatusFilter = 'active';
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
      this.currentPage = 1; // Toujours revenir à la première page si records change
      this.updatePipeline();
    }
    if (changes['initialStatus'] && changes['initialStatus'].currentValue) {
      this.activeStatusFilter = changes['initialStatus'].currentValue;
      this.currentPage = 1; // Revenir à la première page
      this.updatePipeline();
    }
  }

  ngOnInit(): void {
    // Applique le filtre initial même si l'input ne change pas (ex: navigation directe ou retour sur l'onglet)
    this.activeStatusFilter = this.initialStatus;
    this.currentPage = 1;
    this.updatePipeline();
  }

  setStatusFilter(status: StatusFilter): void {
    // Permettre aussi 'discontinued' comme équivalent d'annulées
    if (status === 'cancelled') {
      this.activeStatusFilter = status;
    } else {
      this.activeStatusFilter = status;
    }
    this.currentPage = 1; // Revenir à la première page
    this.updatePipeline();
  }

  updatePipeline(): void {
    let filtered = [...this.records];

    // 1. Filtrer par statut
    if (this.activeStatusFilter !== 'all') {
      if (this.activeStatusFilter === 'cancelled') {
        filtered = filtered.filter(record => record.status === 'cancelled' || record.status === 'discontinued');
      } else {
        filtered = filtered.filter(record => record.status === this.activeStatusFilter);
      }
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
      case 'cancelled':
      case 'discontinued':
        return 'bg-status-urgent/10 text-status-urgent';
      default: return 'bg-status-info/10 text-status-info';
    }
  }

  trackByRecordId(index: number, record: Prescription): number {
    return record.id;
  }
}