export interface Alert {
  id?: string | number;
  title: string;
  description?: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: 'allergy' | 'medication' | 'condition' | 'warning';
  isActive: boolean;
  createdAt?: string;
  patient_id?: number;
}

export class AlertHelper {
  static getSeverityOrder(severity: string): number {
    switch (severity) {
      case 'critical': return 1;
      case 'high': return 2;
      case 'medium': return 3;
      case 'low': return 4;
      default: return 5;
    }
  }

  static getSeverityStyles(severity: string) {
    switch (severity) {
      case 'critical':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          icon: 'text-red-500',
          text: 'text-red-800',
          badge: 'bg-red-100 text-red-700'
        };
      case 'high':
        return {
          bg: 'bg-amber-50',
          border: 'border-amber-200',
          icon: 'text-amber-500',
          text: 'text-amber-800',
          badge: 'bg-amber-100 text-amber-700'
        };
      case 'medium':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          icon: 'text-yellow-500',
          text: 'text-yellow-800',
          badge: 'bg-yellow-100 text-yellow-700'
        };
      case 'low':
      default:
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          icon: 'text-blue-500',
          text: 'text-blue-800',
          badge: 'bg-blue-100 text-blue-700'
        };
    }
  }

  static createFromAllergy(allergy: any, index: number): Alert {
    const title = allergy.name || allergy.title || allergy.allergen || allergy.substance || allergy || 'Unknown Allergy';
    return {
      id: allergy.id || `allergy-${index}`,
      title: title,
      description: allergy.description || `Allergic to ${title}`,
      severity: 'critical',
      type: 'allergy',
      isActive: allergy.isActive !== false,
      createdAt: allergy.createdAt || allergy.created_at
    };
  }

  static createFromPatientAlert(alert: any, index: number): Alert {
    return {
      id: alert.id || `alert-${index}`,
      title: alert.title || alert.message || 'Alert',
      description: alert.description || '',
      severity: (alert.severity || 'medium').toLowerCase() as any,
      type: alert.type || 'general',
      isActive: alert.isActive !== false && alert.is_active !== false,
      createdAt: alert.createdAt || alert.created_at
    };
  }

  static deduplicateAlerts(alerts: Alert[]): Alert[] {
    const seen = new Map<string, Alert>();
    
    alerts.forEach(alert => {
      const key = alert.title.toLowerCase().trim();
      const existing = seen.get(key);
      
      // Keep the alert with the highest severity (lowest order number)
      if (!existing || AlertHelper.getSeverityOrder(alert.severity) < AlertHelper.getSeverityOrder(existing.severity)) {
        seen.set(key, alert);
      }
    });
    
    return Array.from(seen.values()).sort(
      (a, b) => AlertHelper.getSeverityOrder(a.severity) - AlertHelper.getSeverityOrder(b.severity)
    );
  }
}
