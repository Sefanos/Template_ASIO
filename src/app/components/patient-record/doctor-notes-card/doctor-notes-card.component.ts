import { Component, Input, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';

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
  imports: [CommonModule],
  templateUrl: './doctor-notes-card.component.html',
})
export class DoctorNotesCardComponent implements OnChanges {
  @Input() patientId: number | null = null;
  @Input() notes: Note[] = []; // Change to properly receive notes from parent
  
  constructor(private cdr: ChangeDetectorRef) {}
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['notes']) {
      console.log('Doctor notes updated:', this.notes?.length || 0);
      // Force change detection when notes change
      setTimeout(() => this.cdr.detectChanges(), 0);
    }
  }
}