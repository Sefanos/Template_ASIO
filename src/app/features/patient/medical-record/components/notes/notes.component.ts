import { Component, OnInit } from '@angular/core';
import { Note } from '../../../../../core/patient/domain/models/note.model';
import { NoteService } from '../../../../../core/patient/services/note.service';

@Component({
  selector: 'app-notes',
  templateUrl: './notes.component.html',
  standalone: false,
  styleUrls: ['./notes.component.css']
})
export class NotesComponent implements OnInit {
  notes: Note[] = [];
  isLoading = true;
  error: string | null = null;

  // Pagination
  page = 1;
  pageSize = 4;
  get totalPages(): number {
    return Math.ceil(this.notes.length / this.pageSize) || 1;
  }
  get paginatedNotes(): Note[] {
    const start = (this.page - 1) * this.pageSize;
    return this.notes.slice(start, start + this.pageSize);
  }

  constructor(private noteService: NoteService) {}

  ngOnInit(): void {
    this.noteService.getPatientNotes().subscribe({
      next: notes => {
        this.notes = notes;
        this.isLoading = false;
      },
      error: err => {
        this.error = "Erreur lors du chargement des notes.";
        this.isLoading = false;
      }
    });
  }

  getNoteTypeIcon(type: string): string {
    switch (type) {
      case 'diagnosis': return 'fas fa-stethoscope text-indigo-600';
      case 'follow_up': return 'fas fa-notes-medical text-green-600';
      default: return 'fas fa-clipboard text-gray-500';
    }
  }

  getNoteTypeLabel(type: string): string {
    switch (type) {
      case 'diagnosis': return 'Diagnostic';
      case 'follow_up': return 'Suivi';
      default: return 'Note';
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.page = page;
    }
  }
  nextPage(): void { if (this.page < this.totalPages) this.page++; }
  prevPage(): void { if (this.page > 1) this.page--; }
}