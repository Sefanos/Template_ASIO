import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Testimonial {
  name: string;
  location: string;
  rating: number;
  comment: string;
  avatar: string;
}

@Component({
  selector: 'app-landing-booking',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './landing-booking.component.html',
  styleUrls: ['./landing-booking.component.css']
})
export class LandingBookingComponent implements OnInit {
  @Output() bookingClick = new EventEmitter<void>();
  
  isVisible = false;
  selectedDate = new Date();
  
  testimonials: Testimonial[] = [
    {
      name: "Amina Benali",
      location: "Casablanca",
      rating: 5,
      comment: "The calendar booking made scheduling so easy. My doctor was professional and caring.",
      avatar: "AB"
    },
    {
      name: "Omar Rachid",
      location: "Marrakech", 
      rating: 5,
      comment: "Found the perfect specialist within minutes. The instant booking saved me so much time.",
      avatar: "OR"
    },
    {
      name: "Fatima El Idrissi",
      location: "Rabat",
      rating: 5,
      comment: "The AI recommendations helped me understand my condition better. Excellent platform!",
      avatar: "FE"
    }
  ];

  ngOnInit(): void {
    this.setupIntersectionObserver();
  }

  private setupIntersectionObserver(): void {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.isVisible = true;
          }
        });
      },
      { threshold: 0.1 }
    );

    setTimeout(() => {
      const element = document.getElementById('booking-section');
      if (element) {
        observer.observe(element);
      }
    }, 100);
  }

  onBookingClick(): void {
    this.bookingClick.emit();
  }

  getStarArray(rating: number): boolean[] {
    return Array(5).fill(false).map((_, i) => i < rating);
  }
}
