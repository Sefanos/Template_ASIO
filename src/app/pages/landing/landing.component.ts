import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LandingNavbarComponent } from '../../components/landing/landing-navbar/landing-navbar.component';
import { LandingHeroComponent } from '../../components/landing/landing-hero/landing-hero.component';
import { LandingFeaturesComponent } from '../../components/landing/landing-features/landing-features.component';
import { LandingBookingComponent } from '../../components/landing/landing-booking/landing-booking.component';
import { LandingFooterComponent } from '../../components/landing/landing-footer/landing-footer.component';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    CommonModule,
    LandingNavbarComponent,
    LandingHeroComponent,
    LandingFeaturesComponent,
    LandingBookingComponent,
    LandingFooterComponent
  ],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css']
})
export class LandingComponent implements OnInit {

  constructor(private router: Router) { }

  ngOnInit(): void {
    // Initialize any landing page specific logic
  }

  onSignInClick(): void {
    this.router.navigate(['/login']);
  }
  onBookingClick(): void {
    // Navigate to a public booking page or show booking modal
    // Users can book without authentication and create account during the process
    this.router.navigate(['/booking']);
  }
}
