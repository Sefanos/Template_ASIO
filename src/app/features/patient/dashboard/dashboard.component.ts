import { Component, OnInit } from '@angular/core';
import { PatientSummaryService } from '../../../core/patient/services/patient-summary.service';
import { Router } from '@angular/router';

interface VitalSign {
  recordedAt: string;
  bloodPressure?: { reading?: string };
  pulseRate?: number | string;
  temperature?: { display?: string };
  respiratoryRate?: number | string;
  oxygenSaturation?: number | string;
  weight?: { display?: string };
  height?: { display?: string };
  recordedBy?: string;
}


@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {  
  
    loading = true;
  error: string | null = null;
  summary: any = null;
 today = new Date();


  refresh(): void {
    this.loading = true;
    this.error = null;
    this.summaryService.getSummary().subscribe({
      next: data => {
        this.summary = data;
        this.loading = false;
        this.today = new Date();
      },
      error: err => {
        this.error = "Unable to load your medical summary.";
        this.loading = false;
      }
    });
  }



constructor(private summaryService: PatientSummaryService,
 
  private router: Router 
) {}

ngOnInit(): void {
    this.summaryService.getSummary().subscribe({
      next: data => {
        this.summary = data;
        this.loading = false;
      },
      error: err => {
        this.error = "Unable to load your medical summary.";
        this.loading = false;
      }
    });
  }
  get fullName(): string {
    return this.summary?.basic_info?.full_name || '';
  }
  get registrationDate(): string {
    return this.summary?.basic_info?.registration_date || '';
  }
  get age(): string {
    return this.summary?.basic_info?.age || '';
  }
  get gender(): string {
    return this.summary?.basic_info?.gender || '';
  }

  goToAppointments(): void {
    this.router.navigate(['/patient/appointments']);
  }

goToVitals(): void {
  this.router.navigate(['/patient/medical-record'], { queryParams: { tab: 'VitalSigns' } });
}
goToMedicationsHistory(): void {
  this.router.navigate(['/patient/medical-record'], { queryParams: { tab: 'Prescription', status: 'active' } });
}
goToLabResults(): void {
  this.router.navigate(['/patient/medical-record'], { queryParams: { tab: 'LabResult' } });
}
goToNotes(): void {
  this.router.navigate(['/patient/medical-record'], { queryParams: { tab: 'Notes' } });
}

goToEventHistory(): void {
  this.router.navigate(['/patient/medical-record'], { queryParams: { tab: 'Files' } });
}
}