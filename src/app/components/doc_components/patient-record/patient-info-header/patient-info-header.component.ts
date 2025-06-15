import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges, ChangeDetectorRef, AfterViewInit, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-patient-info-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './patient-info-header.component.html',
})
export class PatientInfoHeaderComponent implements OnInit, OnChanges, AfterViewInit {
  @Input() patientId: number = 0;
  @Input() name: string = 'Unknown Patient';
  @Input() dob: string = '';
  @Input() phone: string = '';
  
  // For tracking state
  displayName: string = '';
  
  @Output() newPrescription = new EventEmitter<void>();
  @Output() scheduleAppointment = new EventEmitter<void>();
  @Output() sendMessage = new EventEmitter<void>();
  
  constructor(private cdr: ChangeDetectorRef) {}
  
  ngOnInit(): void {
    // Initialize displayName with the input name or fallback
    this.updateDisplayName();
    console.log('Patient info header initialized with name:', this.name);
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    // Update display name whenever input changes
    if (changes['name']) {
      console.log('Patient name changed:', changes['name'].currentValue);
      this.updateDisplayName();
    }
  }
  
  ngAfterViewInit(): void {
    // Force change detection after view is initialized
    setTimeout(() => {
      this.updateDisplayName();
      this.cdr.detectChanges();
      console.log('After view init, name:', this.displayName);
    }, 0);
  }
    private updateDisplayName(): void {
    this.displayName = this.name || 'Patient Inconnu';
    // Force change detection
    this.cdr.detectChanges();
  }
  
  onNewPrescription(): void {
    this.newPrescription.emit();
  }
  
  onScheduleAppointment(): void {
    this.scheduleAppointment.emit();
  }
  
  onSendMessage(): void {
    this.sendMessage.emit();
  }
}