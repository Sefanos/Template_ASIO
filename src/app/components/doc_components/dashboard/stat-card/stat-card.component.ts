import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface StatItem {
  label: string;
  value: string | number;
  status?: 'normal' | 'warning' | 'urgent' | 'info';
}

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './stat-card.component.html',
  styleUrls: ['./stat-card.component.css']
})
export class StatCardComponent {
  @Input() title: string = '';
  @Input() badge: string = '';
  @Input() badgeType: 'primary' | 'warning' | 'urgent' | 'info' = 'primary';
  @Input() items: StatItem[] = [];
  @Input() linkText: string = 'View';
  @Input() linkUrl: string = '#';
}
