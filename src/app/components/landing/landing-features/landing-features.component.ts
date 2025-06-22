import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Feature {
  icon: string;
  title: string;
  description: string;
  gradient: string;
}

@Component({
  selector: 'app-landing-features',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './landing-features.component.html',
  styleUrls: ['./landing-features.component.css']
})
export class LandingFeaturesComponent implements OnInit {
  isVisible = false;
  
  features: Feature[] = [
    {
      icon: 'brain',
      title: "AI-Assisted Diagnosis",
      description: "Get intelligent health insights and personalized treatment recommendations.",
      gradient: "from-blue-100 to-blue-50"
    },
    {
      icon: 'shield',
      title: "Secure Medical Records",
      description: "Your medical data is encrypted and protected with bank-level security.",
      gradient: "from-green-100 to-green-50"
    },
    {
      icon: 'heart',
      title: "Personalized Care",
      description: "Tailored healthcare solutions designed specifically for you and your family.",
      gradient: "from-teal-100 to-teal-50"
    },
    {
      icon: 'clock',
      title: "24/7 Support",
      description: "Round-the-clock customer support for all your healthcare needs.",
      gradient: "from-purple-100 to-purple-50"
    }
  ];

  ngOnInit(): void {
    // Setup intersection observer for animations
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

    // Observe the component after view init
    setTimeout(() => {
      const element = document.getElementById('features-section');
      if (element) {
        observer.observe(element);
      }
    }, 100);
  }

  getIconSvg(iconName: string): string {
    const icons: { [key: string]: string } = {
      brain: 'M9.5 2A2.5 2.5 0 0 0 7 4.5v15A2.5 2.5 0 0 0 9.5 22h5a2.5 2.5 0 0 0 2.5-2.5v-15A2.5 2.5 0 0 0 14.5 2h-5z',
      shield: 'M12 1l3 3 3-3v6.5C18 11.42 15.42 14 12 14s-6-2.58-6-6.5V1l3 3 3-3z',
      heart: 'M21 8.5c0-2.5-2-4.5-4.5-4.5S12 6 12 8.5c0-2.5-2-4.5-4.5-4.5S3 6 3 8.5c0 3.78 3 6.94 6 9.5 1 1 2 1 2 1s1 0 2-1c3-2.56 6-5.72 6-9.5z',
      clock: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z'
    };
    return icons[iconName] || icons['heart'];
  }
}
