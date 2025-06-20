import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface VitalAnalytics {
  bloodPressure: {
    systolic: { min: number; max: number; avg: number; };
    diastolic: { min: number; max: number; avg: number; };
    trend: 'improving' | 'stable' | 'concerning';
  };
  pulse: {
    min: number; max: number; avg: number;
    trend: 'improving' | 'stable' | 'concerning';
  };
  temperature: {
    min: number; max: number; avg: number;
    feverEpisodes: number;
  };
  overall: {
    totalReadings: number;
    timespan: string;
    riskLevel: 'low' | 'moderate' | 'high';
    recommendations: string[];
  };
}

@Component({
  selector: 'app-vital-signs-analytics',
  standalone: true,
  imports: [CommonModule , FormsModule],
  templateUrl: './vital-signs-analytics.component.html',
  styleUrls: ['./vital-signs-analytics.component.css']
})
export class VitalSignsAnalyticsComponent implements OnInit {
  @Input() isOpen: boolean = false;
  @Input() vitals: any[] = [];
  @Input() patientId: string = '';
  
  @Output() closeAnalytics = new EventEmitter<void>();
  
  analytics: VitalAnalytics | null = null;
  selectedTimeframe: string = '30'; // days
  isLoading: boolean = false;
  
  timeframes = [
    { value: '7', label: 'Last 7 Days' },
    { value: '30', label: 'Last 30 Days' },
    { value: '90', label: 'Last 90 Days' },
    { value: '365', label: 'Last Year' }
  ];
  
  ngOnInit() {
    if (this.vitals.length > 0) {
      this.generateAnalytics();
    }
  }
  
  close(): void {
    this.isOpen = false;
    this.closeAnalytics.emit();
  }
  
  onTimeframeChange(): void {
    this.generateAnalytics();
  }
  
  generateAnalytics(): void {
    this.isLoading = true;
    
    // Filter vitals by timeframe
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(this.selectedTimeframe));
    
    const filteredVitals = this.vitals.filter(vital => {
      const vitalDate = new Date(vital.recordedAt || vital.date);
      return vitalDate >= cutoffDate;
    });
    
    if (filteredVitals.length === 0) {
      this.analytics = null;
      this.isLoading = false;
      return;
    }
    
    // Calculate analytics
    const systolicValues = filteredVitals.map(v => this.getSystolic(v)).filter(v => v > 0);
    const diastolicValues = filteredVitals.map(v => this.getDiastolic(v)).filter(v => v > 0);
    const pulseValues = filteredVitals.map(v => this.getPulse(v)).filter(v => v > 0);
    const tempValues = filteredVitals.map(v => this.getTemperature(v)).filter(v => v > 0);
    
    this.analytics = {
      bloodPressure: {
        systolic: {
          min: Math.min(...systolicValues),
          max: Math.max(...systolicValues),
          avg: Math.round(systolicValues.reduce((a, b) => a + b, 0) / systolicValues.length)
        },
        diastolic: {
          min: Math.min(...diastolicValues),
          max: Math.max(...diastolicValues),
          avg: Math.round(diastolicValues.reduce((a, b) => a + b, 0) / diastolicValues.length)
        },
        trend: this.calculateBPTrend(filteredVitals)
      },
      pulse: {
        min: Math.min(...pulseValues),
        max: Math.max(...pulseValues),
        avg: Math.round(pulseValues.reduce((a, b) => a + b, 0) / pulseValues.length),
        trend: this.calculatePulseTrend(filteredVitals)
      },
      temperature: {
        min: Math.min(...tempValues),
        max: Math.max(...tempValues),
        avg: Math.round((tempValues.reduce((a, b) => a + b, 0) / tempValues.length) * 10) / 10,
        feverEpisodes: tempValues.filter(temp => temp >= 100.4).length
      },
      overall: {
        totalReadings: filteredVitals.length,
        timespan: this.getTimeframeLabel(),
        riskLevel: this.calculateRiskLevel(filteredVitals),
        recommendations: this.generateRecommendations(filteredVitals)
      }
    };
    
    this.isLoading = false;
  }
  
  // Helper methods
  getSystolic(vital: any): number {
    return vital.bloodPressure?.systolic || vital.systolic || 0;
  }
  
  getDiastolic(vital: any): number {
    return vital.bloodPressure?.diastolic || vital.diastolic || 0;
  }
  
  getPulse(vital: any): number {
    return vital.pulseRate || vital.pulse || 0;
  }
  
  getTemperature(vital: any): number {
    return parseFloat(vital.temperature?.value) || vital.temperature || 0;
  }
  
  calculateBPTrend(vitals: any[]): 'improving' | 'stable' | 'concerning' {
    if (vitals.length < 3) return 'stable';
    
    const recentVitals = vitals.slice(-3);
    const avgSystolic = recentVitals.reduce((sum, v) => sum + this.getSystolic(v), 0) / 3;
    
    if (avgSystolic < 120) return 'improving';
    if (avgSystolic > 140) return 'concerning';
    return 'stable';
  }
  
  calculatePulseTrend(vitals: any[]): 'improving' | 'stable' | 'concerning' {
    if (vitals.length < 3) return 'stable';
    
    const recentVitals = vitals.slice(-3);
    const avgPulse = recentVitals.reduce((sum, v) => sum + this.getPulse(v), 0) / 3;
    
    if (avgPulse >= 60 && avgPulse <= 100) return 'improving';
    if (avgPulse > 120 || avgPulse < 50) return 'concerning';
    return 'stable';
  }
  
  calculateRiskLevel(vitals: any[]): 'low' | 'moderate' | 'high' {
    const highBPCount = vitals.filter(v => this.getSystolic(v) > 140 || this.getDiastolic(v) > 90).length;
    const highPulseCount = vitals.filter(v => this.getPulse(v) > 120).length;
    const feverCount = vitals.filter(v => this.getTemperature(v) >= 100.4).length;
    
    const riskFactors = highBPCount + highPulseCount + feverCount;
    
    if (riskFactors === 0) return 'low';
    if (riskFactors <= 2) return 'moderate';
    return 'high';
  }
  
  generateRecommendations(vitals: any[]): string[] {
    const recommendations: string[] = [];
    
    const avgSystolic = vitals.reduce((sum, v) => sum + this.getSystolic(v), 0) / vitals.length;
    const avgPulse = vitals.reduce((sum, v) => sum + this.getPulse(v), 0) / vitals.length;
    
    if (avgSystolic > 140) {
      recommendations.push('Consider blood pressure monitoring and lifestyle modifications');
    }
    
    if (avgPulse > 100) {
      recommendations.push('Monitor heart rate and consider cardiac evaluation');
    }
    
    if (this.analytics?.temperature.feverEpisodes! > 0) {
      recommendations.push('Track temperature patterns and potential infections');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Vital signs are within normal ranges - continue monitoring');
    }
    
    return recommendations;
  }
  
  getTimeframeLabel(): string {
    const timeframe = this.timeframes.find(t => t.value === this.selectedTimeframe);
    return timeframe?.label || 'Selected Period';
  }
  
  getTrendIcon(trend: string): string {
    switch (trend) {
      case 'improving': return '📈';
      case 'concerning': return '⚠️';
      default: return '➖';
    }
  }
  
  getRiskColor(risk: string): string {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'moderate': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }
  
}