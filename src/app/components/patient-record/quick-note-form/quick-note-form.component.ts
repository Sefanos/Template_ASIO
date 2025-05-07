import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-quick-note-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './quick-note-form.component.html',
})
export class QuickNoteFormComponent {
  @Input() show: boolean = false;
  @Input() quickNote: string = '';
  @Output() quickNoteChange = new EventEmitter<string>();
  @Output() saveNote = new EventEmitter<void>();
  @Output() cancelNote = new EventEmitter<void>();
  
  onQuickNoteChange(value: string): void {
    this.quickNoteChange.emit(value);
  }
  
  onSaveNote(): void {
    this.saveNote.emit();
  }
  
  onCancelNote(): void {
    this.cancelNote.emit();
  }
}