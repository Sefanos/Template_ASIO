import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-landing-hero',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './landing-hero.component.html',
  styleUrls: ['./landing-hero.component.css']
})
export class LandingHeroComponent implements OnInit {
  @Output() bookingClick = new EventEmitter<void>();
  
  isVisible = false;

  ngOnInit(): void {
    // Trigger animation after component loads
    setTimeout(() => {
      this.isVisible = true;
    }, 100);
  }

  onBookingClick(): void {
    this.bookingClick.emit();
  }
}
