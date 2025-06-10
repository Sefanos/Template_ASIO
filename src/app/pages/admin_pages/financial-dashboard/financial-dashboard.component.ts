import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

// Import dashboard header component
import { DashboardHeaderComponent } from '../../../components/admin_components/dashboard/dashboard-header/dashboard-header.component';
// Import financial components
import { DoctorRevenueComponent } from '../../../components/admin_components/financial/doctor-revenue/doctor-revenue.component';
import { RevenueOverviewComponent } from '../../../components/admin_components/financial/revenue-overview/revenue-overview.component';
import { RevenueTimelineComponent } from '../../../components/admin_components/financial/revenue-timeline/revenue-timeline.component';

@Component({
  selector: 'app-financial-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    DashboardHeaderComponent,
    RevenueOverviewComponent,
    RevenueTimelineComponent,
    DoctorRevenueComponent
  ],
  templateUrl: './financial-dashboard.component.html',
  styleUrls: ['./financial-dashboard.component.css']
})
export class FinancialDashboardComponent {
  currentDate = new Date();
}
