import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-patient-alerts',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './patient-alerts.component.html'
})
export class PatientAlertsComponent {
  @Input() allergies: any[] = [];
  @Input() alerts: any[] = [];

  // Get formatted allergy names from objects or strings
  getFormattedAllergies(): string[] {
    if (!this.allergies || !Array.isArray(this.allergies)) {
      return [];
    }

    return this.allergies
      .map(allergy => {
        if (typeof allergy === 'string') {
          return allergy;
        }
        
        // Handle object-based allergies
        if (typeof allergy === 'object' && allergy !== null) {
          // Try common property names for allergy objects
          return allergy.name || 
                 allergy.allergen || 
                 allergy.substance || 
                 allergy.allergy || 
                 allergy.description ||
                 allergy.title ||
                 JSON.stringify(allergy); // Fallback to show object structure
        }
        
        return String(allergy); // Convert to string as fallback
      })
      .filter(allergy => allergy && allergy.trim().length > 0);
  }

  // Get allergy severity if available
  getAllergySeverity(allergy: any): string {
    if (typeof allergy === 'object' && allergy !== null) {
      return allergy.severity || allergy.level || 'Unknown';
    }
    return 'Unknown';
  }

  // Check if allergies exist and are valid
  hasValidAllergies(): boolean {
    return this.getFormattedAllergies().length > 0;
  }

  // Filter out empty or invalid alerts
  getValidAlerts(): any[] {
    if (!this.alerts || !Array.isArray(this.alerts)) {
      return [];
    }

    return this.alerts.filter(alert => 
      alert && 
      (alert.title || alert.message || alert.description) && 
      (alert.title?.trim() || alert.message?.trim() || alert.description?.trim())
    );
  }

  formatAlertDate(dateString: string): string {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch (error) {
      return '';
    }
  }
}