import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-print-options',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './print-options.component.html',
})
export class PrintOptionsComponent {
  @Input() show: boolean = false;
  @Output() printSection = new EventEmitter<string>();
  
  onPrintSection(section: string): void {
    this.printSection.emit(section);
  }
}