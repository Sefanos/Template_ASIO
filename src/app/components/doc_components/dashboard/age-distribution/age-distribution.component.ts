import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-age-distribution',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './age-distribution.component.html',
  styleUrls: ['./age-distribution.component.css']
})
export class AgeDistributionComponent {
  // Age distribution data
  ageGroups = [
    { range: '0-18 years', percentage: 18, color: 'bg-status-info' },
    { range: '19-35 years', percentage: 25, color: 'bg-status-success' },
    { range: '36-50 years', percentage: 32, color: 'bg-primary' },
    { range: '51-65 years', percentage: 15, color: 'bg-status-warning' },
    { range: '65+ years', percentage: 10, color: 'bg-status-urgent' }
  ];
}
