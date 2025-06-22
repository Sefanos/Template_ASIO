import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Updated interface to match real API data structure
interface ApiNote {
  id: number;
  content: string;
  category: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  isPrivate: boolean;
}

// Legacy interface for backward compatibility
interface Note {
  id: number;
  date: string;
  content: string;
  provider: string;
  type: string;
}

@Component({
  selector: 'app-doctor-notes-card',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './doctor-notes-card.component.html',
})
export class DoctorNotesCardComponent implements OnChanges {
  @Input() patientId: number | null = null;
  @Input() notes: any[] = []; // Accept both old and new format
  @Output() noteAdded = new EventEmitter<any>();
  
  showAll: boolean = false;
  expandedNotes: Set<number> = new Set();
  
  // Quick add note form
  quickNoteContent: string = '';
  quickNoteCategory: string = 'general';
  quickNoteIsPrivate: boolean = false;
  isAddingNote: boolean = false;
  
  constructor(private cdr: ChangeDetectorRef) {}
    ngOnChanges(changes: SimpleChanges): void {
    if (changes['notes']) {
      console.log('Doctor notes updated:', this.notes?.length || 0);
      // Removed cdr.detectChanges() to prevent Angular assertion errors
      // Angular will automatically detect changes when input properties change
    }
  }
  
  get displayNotes(): any[] {
    const recentNotes = this.notes.slice(0, this.showAll ? this.notes.length : 2);
    return recentNotes.sort((a, b) => 
      new Date(this.getCreatedDate(b)).getTime() - new Date(this.getCreatedDate(a)).getTime()
    );
  }
  
  get hasMoreNotes(): boolean {
    return this.notes.length > 3;
  }
  
  // Helper methods for note data
  getContent(note: any): string {
    return note.content || 'No content available';
  }
  
  getCategory(note: any): string {
    return note.category || note.type || 'General';
  }
  
  getCategoryColor(category: string): string {
    switch (category.toLowerCase()) {
      case 'diagnosis': return 'bg-red-100 text-red-800 border-red-200';
      case 'treatment': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'follow-up': return 'bg-green-100 text-green-800 border-green-200';
      case 'prescription': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'lab': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'consultation': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }
  
  getCategoryIcon(category: string): string {
    switch (category.toLowerCase()) {
      case 'diagnosis': return '🩺';
      case 'treatment': return '💊';
      case 'follow-up': return '📅';
      case 'prescription': return '📋';
      case 'lab': return '🔬';
      case 'consultation': return '👨‍⚕️';
      default: return '📝';
    }
  }
  
  getCreatedDate(note: any): string {
    return note.createdAt || note.date || new Date().toISOString();
  }
  
  getUpdatedDate(note: any): string {
    return note.updatedAt || note.date || '';
  }
  
  getCreatedBy(note: any): string {
    return note.createdBy || note.provider || 'Unknown Doctor';
  }
  
  isPrivate(note: any): boolean {
    return note.isPrivate || false;
  }
  
  isRecentNote(note: any): boolean {
    const noteDate = new Date(this.getCreatedDate(note));
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return noteDate > sevenDaysAgo;
  }
  
  getPreviewText(content: string, maxLength: number = 150): string {
    if (content.length <= maxLength) {
      return content;
    }
    return content.substring(0, maxLength) + '...';
  }
  
  toggleShowAll(): void {
    this.showAll = !this.showAll;
  }
    getNoteCategoryCounts(): { [key: string]: number } {
    const counts: { [key: string]: number } = {};
    this.notes.forEach(note => {
      const category = this.getCategory(note);
      counts[category] = (counts[category] || 0) + 1;
    });
    return counts;
  }
  
  getTopCategories(): string[] {
    const counts = this.getNoteCategoryCounts();
    return Object.keys(counts).slice(0, 3);
  }

  /**
   * Toggle note expansion
   */
  toggleNoteExpansion(noteId: number): void {
    if (this.expandedNotes.has(noteId)) {
      this.expandedNotes.delete(noteId);
    } else {
      this.expandedNotes.add(noteId);
    }
  }

  /**
   * Check if note is expanded
   */
  isNoteExpanded(noteId: number): boolean {
    return this.expandedNotes.has(noteId);
  }

  /**
   * Add a new quick note
   */
  addQuickNote(): void {
    if (!this.quickNoteContent.trim()) {
      return;
    }

    this.isAddingNote = true;

    // Create the new note object
    const newNote = {
      id: Date.now(), // Temporary ID
      content: this.quickNoteContent.trim(),
      category: this.quickNoteCategory,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'Current Doctor', // This should come from auth service
      isPrivate: this.quickNoteIsPrivate
    };

    // Add to local notes array immediately
    this.notes.unshift(newNote);

    // Emit to parent component to handle API call
    this.noteAdded.emit(newNote);

    // Reset form
    this.quickNoteContent = '';
    this.quickNoteCategory = 'general';
    this.quickNoteIsPrivate = false;
    this.isAddingNote = false;

    console.log('Quick note added:', newNote);
  }
}
