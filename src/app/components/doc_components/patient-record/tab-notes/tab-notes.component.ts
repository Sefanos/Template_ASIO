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
}