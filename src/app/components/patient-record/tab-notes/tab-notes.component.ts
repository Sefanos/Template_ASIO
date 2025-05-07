import { Component, Input, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Note {
  id: number;
  date: string;
  provider: string;
  content: string;
  type: 'progress' | 'consultation' | 'procedure' | 'quick';
}

@Component({
  selector: 'app-tab-notes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tab-notes.component.html',
})
export class TabNotesComponent implements OnChanges {
  @Input() notes: Note[] = [];
  
  noteCategories: string[] = ['All Notes', 'Progress Notes', 'Consultation Notes', 'Procedure Notes', 'Quick Notes'];
  selectedCategory: string = 'All Notes';
  
  newNote: string = '';
  showNewNoteForm: boolean = false;
  
  constructor(private cdr: ChangeDetectorRef) {}
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['notes']) {
      console.log('Notes tab data updated:', this.notes?.length || 0);
      // Force change detection when notes change
      setTimeout(() => this.cdr.detectChanges(), 0);
    }
  }
  
  setCategory(category: string): void {
    this.selectedCategory = category;
    // Force change detection when category changes
    this.cdr.detectChanges();
  }
  
  toggleNewNoteForm(): void {
    this.showNewNoteForm = !this.showNewNoteForm;
    // Force change detection when form visibility changes
    this.cdr.detectChanges();
  }
  
  saveNewNote(): void {
    // In a real app, this would call a service to save the note
    console.log('Saving new note:', this.newNote);
    this.newNote = '';
    this.showNewNoteForm = false;
    // Force change detection after saving note
    this.cdr.detectChanges();
  }
  
  get filteredNotes(): Note[] {
    if (this.selectedCategory === 'All Notes') {
      return this.notes;
    }
    
    const typeMap: {[key: string]: string} = {
      'Progress Notes': 'progress',
      'Consultation Notes': 'consultation',
      'Procedure Notes': 'procedure',
      'Quick Notes': 'quick'
    };
    
    return this.notes.filter(note => note.type === typeMap[this.selectedCategory]);
  }
}