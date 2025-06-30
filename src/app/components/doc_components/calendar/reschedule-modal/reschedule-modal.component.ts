import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-reschedule-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reschedule-modal.component.html',
  styleUrls: ['./reschedule-modal.component.css']
})
export class RescheduleModalComponent {
  @Input() show = false;
  @Input() appointmentTitle = '';
  @Input() currentDate = '';
  @Input() currentTime = '';
  @Output() reschedule = new EventEmitter<{date: string, time: string, reason: string}>();
  @Output() cancel = new EventEmitter<void>();

  newDate = '';
  newTime = '';
  reason = '';
  isProcessing = false;

  ngOnChanges() {
    if (this.show) {
      // Set default values when modal opens
      this.newDate = this.currentDate;
      this.newTime = this.currentTime;
      this.reason = '';
    }
  }

  onReschedule() {
    if (this.newDate && this.newTime) {
      this.isProcessing = true;
      this.reschedule.emit({
        date: this.newDate,
        time: this.newTime,
        reason: this.reason
      });
    }
  }

  onCancel() {
    this.cancel.emit();
    this.resetForm();
  }

  closeModal() {
    this.onCancel();
  }

  private resetForm() {
    this.newDate = '';
    this.newTime = '';
    this.reason = '';
    this.isProcessing = false;
  }

  // Generate time slots
  getTimeSlots(): string[] {
    const slots = [];
    for (let hour = 8; hour <= 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeString);
      }
    }
    return slots;
  }

  // Get minimum date (today)
  getMinDate(): string {
    return new Date().toISOString().split('T')[0];
  }
}
