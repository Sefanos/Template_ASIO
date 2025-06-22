import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PatientNotesService, PatientNoteResponse, CreatePatientNoteRequest } from '../../../../services/doc-services/patient-notes.service';

interface Note {
  id: number;
  date: string;
  provider: string;
  content: string;
  type: 'progress' | 'consultation' | 'procedure' | 'quick';
  canEdit?: boolean;
  title?: string;
  priority?: 'low' | 'medium' | 'high';
}

@Component({
  selector: 'app-tab-notes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tab-notes.component.html',
})
export class TabNotesComponent implements OnChanges, OnInit {
  @Input() notes: Note[] = [];
  @Input() patientId!: number;
  @Output() noteAdded = new EventEmitter<Note>();
  
  noteCategories: string[] = ['All Notes', 'General Notes', 'Diagnosis', 'Treatment Notes', 'Progress Notes', 'Consultation Notes'];
  selectedCategory: string = 'All Notes';
  
  newNote: string = '';
  newNoteType: string = 'general';
  newNoteTitle: string = '';
  showNewNoteForm: boolean = false;
  
  isLoading: boolean = false;
  isSaving: boolean = false;
  error: string | null = null;
    // Available note types for the dropdown
  noteTypes = [
    { value: 'general', label: 'General Note' },
    { value: 'diagnosis', label: 'Diagnosis' },
    { value: 'treatment', label: 'Treatment Note' },
    { value: 'progress', label: 'Progress Note' },
    { value: 'consultation', label: 'Consultation Note' },
    { value: 'follow-up', label: 'Follow-up Note' },
    { value: 'discharge', label: 'Discharge Note' }
  ];
    // UI state properties
  expandedNotes: Set<number> = new Set();
  editingNoteId: number | null = null;
  editingContent: string = '';
  editingTitle: string = '';

    // Reply functionality
  replyingToNoteId: number | null = null;
  replyContent: string = '';

    constructor(
    private cdr: ChangeDetectorRef,
    private patientNotesService: PatientNotesService
  ) {}

  ngOnInit(): void {
    // Load notes if patientId is available
    if (this.patientId) {
      this.loadPatientNotes();
    }
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['notes']) {
      console.log('Notes tab data updated:', this.notes?.length || 0);
    }
    
    if (changes['patientId'] && this.patientId) {
      console.log('Patient ID changed, loading notes for patient:', this.patientId);
      this.loadPatientNotes();
    }
  }

  /**
   * Load patient notes from the API
   */
  loadPatientNotes(): void {
    if (!this.patientId) {
      console.log('No patient ID provided, skipping note load');
      return;
    }

    this.isLoading = true;
    this.error = null;

    this.patientNotesService.getPatientNotes(this.patientId).subscribe({
      next: (apiNotes) => {
        console.log('Received patient notes from API:', apiNotes);        this.notes = this.transformApiNotesToNotes(apiNotes);
        this.isLoading = false;
        // Removed cdr.detectChanges() to prevent Angular assertion errors
      },
      error: (error) => {
        console.error('Error loading patient notes:', error);
        this.error = 'Failed to load patient notes. Please try again.';
        this.isLoading = false;
        // Removed cdr.detectChanges() to prevent Angular assertion errors
      }
    });
  }  /**
   * Transform API notes to the component's Note interface
   */
  private transformApiNotesToNotes(apiNotes: PatientNoteResponse[]): Note[] {
    return apiNotes.map(apiNote => ({
      id: apiNote.id,
      date: apiNote.createdAt || new Date().toISOString(),
      provider: apiNote.doctorName || apiNote.createdBy || 'Unknown Provider',
      content: apiNote.content || '',
      type: this.mapNoteType(apiNote.type),
      canEdit: apiNote.canEdit ?? false,
      title: apiNote.title || ''
    }));
  }

  /**
   * Extract provider name from API note (updated for new API structure)
   */
  private extractProviderName(apiNote: PatientNoteResponse): string {
    return apiNote.doctorName || apiNote.createdBy || 'Unknown Provider';
  }  /**
   * Map API note type to component note type
   */
  private mapNoteType(apiNoteType: string | null | undefined): 'progress' | 'consultation' | 'procedure' | 'quick' {
    // Check for null, undefined, or empty string
    if (!apiNoteType || typeof apiNoteType !== 'string') {
      console.warn('Invalid note type received:', apiNoteType, 'defaulting to "quick"');
      return 'quick';
    }

    const typeMap: { [key: string]: 'progress' | 'consultation' | 'procedure' | 'quick' } = {
      'progress': 'progress',
      'consultation': 'consultation',
      'procedure': 'procedure',
      'quick': 'quick',
      // Map the API note types from the user's example
      'diagnosis': 'consultation',
      'general': 'quick',
      'treatment': 'progress',
      'follow-up': 'progress',
      'discharge': 'consultation'
    };
    
    return typeMap[apiNoteType.toLowerCase()] || 'quick';
  }
  setCategory(category: string): void {
    this.selectedCategory = category;
  }
  
  toggleNewNoteForm(): void {
    this.showNewNoteForm = !this.showNewNoteForm;
    if (this.showNewNoteForm) {
      // Reset form fields when opening
      this.newNote = '';
      this.newNoteType = 'general';
      this.newNoteTitle = '';
    }
  }
  
  saveNewNote(): void {
    if (!this.newNote.trim() || !this.patientId) {
      console.log('Cannot save note: missing content or patient ID');
      return;
    }

    this.isSaving = true;
    this.error = null;    const newNoteData: CreatePatientNoteRequest = {
      patient_id: this.patientId,
      note_type: this.newNoteType,
      title: this.newNoteTitle.trim() || 'Untitled Note',
      content: this.newNote.trim(),
      is_private: false // Default to not private
    };

    console.log('Saving new note:', newNoteData);

    this.patientNotesService.createPatientNote(newNoteData).subscribe({      next: (createdNote) => {
        console.log('Note saved successfully:', createdNote);
        
        // Reset form first
        this.newNote = '';
        this.newNoteType = 'general';
        this.newNoteTitle = '';
        this.showNewNoteForm = false;
        this.isSaving = false;
        
        // Reload notes from API to get the latest data including the new note
        // This ensures we have the correct timestamps, IDs, and any server-processed data
        this.loadPatientNotes();
        
        // Create the new note object for immediate parent notification
        const newNote: Note = {
          id: createdNote.id,
          date: createdNote.createdAt || new Date().toISOString(),
          provider: this.extractProviderName(createdNote),
          content: createdNote.content || '',
          type: this.mapNoteType(createdNote.type),
          canEdit: createdNote.canEdit ?? false,
          title: createdNote.title || ''
        };
        
        // Emit the new note to parent component for immediate UI updates
        this.noteAdded.emit(newNote);
        
        // Removed cdr.detectChanges() to prevent Angular assertion errors
      },
      error: (error) => {
        console.error('Error saving note:', error);
        this.error = 'Failed to save note. Please try again.';
        this.isSaving = false;
        // Removed cdr.detectChanges() to prevent Angular assertion errors
      }
    });
  }
    get filteredNotes(): Note[] {
    if (this.selectedCategory === 'All Notes') {
      return this.notes;
    }
    
    const typeMap: {[key: string]: string} = {
      'General Notes': 'quick',
      'Diagnosis': 'consultation', 
      'Treatment Notes': 'progress',
      'Progress Notes': 'progress',
      'Consultation Notes': 'consultation'
    };
    
    return this.notes.filter(note => note.type === typeMap[this.selectedCategory]);
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
   * Start editing a note
   */
  startEditingNote(note: Note): void {
    this.editingNoteId = note.id;
    this.editingContent = note.content;
    this.editingTitle = note.title || '';
  }

  /**
   * Cancel editing
   */
  cancelEditing(): void {
    this.editingNoteId = null;
    this.editingContent = '';
    this.editingTitle = '';
  }

  /**
   * Save edited note
   */
  saveEditedNote(noteId: number): void {
    if (!this.editingContent.trim()) {
      this.error = 'Note content cannot be empty';
      return;
    }

    this.isSaving = true;
    this.error = null;

    const updateData = {
      content: this.editingContent.trim(),
      title: this.editingTitle.trim() || 'Untitled Note'
    };

    // TODO: Call API to update note when backend is ready
    // For now, just update locally
    const noteIndex = this.notes.findIndex(n => n.id === noteId);
    if (noteIndex !== -1) {
      this.notes[noteIndex] = {
        ...this.notes[noteIndex],
        content: updateData.content,
        title: updateData.title
      };
    }

    this.cancelEditing();
    this.isSaving = false;
    
    console.log('Note update would be sent to API:', updateData);
  }

  /**
   * Delete a note
   */
  deleteNote(note: Note): void {
    if (!confirm(`Are you sure you want to delete this note?\n\n"${note.title || 'Untitled Note'}"`)) {
      return;
    }

    // TODO: Call API to delete note when backend is ready
    // For now, just remove locally
    this.notes = this.notes.filter(n => n.id !== note.id);
    
    console.log('Note deletion would be sent to API for note ID:', note.id);
  }

  /**
   * Get truncated content for preview
   */
  getTruncatedContent(content: string, maxLength: number = 150): string {
    if (content.length <= maxLength) {
      return content;
    }
    return content.substring(0, maxLength) + '...';
  }

  /**
   * Start replying to a note
   */
  startReplyToNote(noteId: number): void {
    this.replyingToNoteId = noteId;
    this.replyContent = '';
  }

  /**
   * Cancel reply
   */
  cancelReply(): void {
    this.replyingToNoteId = null;
    this.replyContent = '';
  }

  /**
   * Save reply as a new note
   */
  saveReply(originalNote: Note): void {
    if (!this.replyContent.trim()) {
      this.error = 'Reply content cannot be empty';
      return;
    }

    const replyNoteData: CreatePatientNoteRequest = {
      patient_id: this.patientId,
      note_type: 'general',
      title: `Re: ${originalNote.title || 'Note'}`,
      content: `[Reply to note by ${originalNote.provider}]\n\n${this.replyContent.trim()}`,
      is_private: false
    };

    this.isSaving = true;
    this.error = null;

    this.patientNotesService.createPatientNote(replyNoteData).subscribe({
      next: (createdNote) => {
        console.log('Reply saved successfully:', createdNote);
        
        // Reset reply form
        this.cancelReply();
        this.isSaving = false;
        
        // Reload notes to show the new reply
        this.loadPatientNotes();
        
        // Create the new note object for parent notification
        const newNote: Note = {
          id: createdNote.id,
          date: createdNote.createdAt || new Date().toISOString(),
          provider: this.extractProviderName(createdNote),
          content: createdNote.content || '',
          type: this.mapNoteType(createdNote.type),
          canEdit: createdNote.canEdit ?? false,
          title: createdNote.title || ''
        };
        
        // Emit the new note to parent component
        this.noteAdded.emit(newNote);
      },
      error: (error) => {
        console.error('Error saving reply:', error);
        this.error = 'Failed to save reply. Please try again.';
        this.isSaving = false;
      }
    });
  }
}