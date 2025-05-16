import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-new-patients',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './new-patients.component.html',
  styleUrls: ['./new-patients.component.css']
})
export class NewPatientsComponent {
  // New patients data
  newPatientsCount = 58;
  percentageIncrease = 15;
  
  // Monthly data for chart
  monthlyData = [
    { month: 'Nov', count: 30 },
    { month: 'Dec', count: 40 },
    { month: 'Jan', count: 25 },
    { month: 'Feb', count: 50 },
    { month: 'Mar', count: 45 },
    { month: 'Apr', count: 55 },
    { month: 'May', count: 60, isCurrent: true }
  ];
}
