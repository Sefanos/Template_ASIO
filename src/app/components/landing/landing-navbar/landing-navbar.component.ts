import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-landing-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './landing-navbar.component.html',
  styleUrls: ['./landing-navbar.component.css']
})
export class LandingNavbarComponent {
  @Output() signInClick = new EventEmitter<void>();

  onSignInClick(): void {
    this.signInClick.emit();
  }
}
