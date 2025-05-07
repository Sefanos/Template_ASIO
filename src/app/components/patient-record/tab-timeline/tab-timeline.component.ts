import { Component, Input, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimelineEventComponent } from '../timeline-event/timeline-event.component';

interface TimelineEvent {
  id: number;
  date: string;
  type: 'appointment' | 'medication' | 'labResult' | 'diagnosis' | 'note';
  title: string;
  description: string;
  provider?: string;
  status?: string;
}

@Component({
  selector: 'app-tab-timeline',
  standalone: true,
  imports: [CommonModule, TimelineEventComponent],
  templateUrl: './tab-timeline.component.html',
})
export class TabTimelineComponent implements OnChanges {
  @Input() events: TimelineEvent[] = [];
  
  filterOptions: string[] = ['All', 'Appointments', 'Medications', 'Lab Results', 'Diagnoses', 'Notes'];
  selectedFilter: string = 'All';
  
  constructor(private cdr: ChangeDetectorRef) {}
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['events']) {
      console.log('Timeline events updated:', this.events?.length || 0);
      // Force change detection when events change
      setTimeout(() => this.cdr.detectChanges(), 0);
    }
  }
  
  setFilter(filter: string): void {
    this.selectedFilter = filter;
    // Force change detection when filter changes
    this.cdr.detectChanges();
  }
  
  get filteredEvents(): TimelineEvent[] {
    if (this.selectedFilter === 'All') {
      return this.events;
    }
    
    const typeMap: {[key: string]: string} = {
      'Appointments': 'appointment',
      'Medications': 'medication',
      'Lab Results': 'labResult',
      'Diagnoses': 'diagnosis',
      'Notes': 'note'
    };
    
    return this.events.filter(event => event.type === typeMap[this.selectedFilter]);
  }
}