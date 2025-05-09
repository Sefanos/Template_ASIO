import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Patient } from '../../../models/patient.model';
import { Prescription } from '../../../models/prescription.model';
import { PatientService } from '../../../services/patient.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-tab-prescriptions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tab-prescriptions.component.html',
  styleUrls: ['./tab-prescriptions.component.css']
})
export class TabPrescriptionsComponent implements OnInit {
  @Input() patient: Patient | null = null;
  
  prescriptions: Prescription[] = [];
  loading = true;
  
  constructor(
    private patientService: PatientService,
    private router: Router
  ) {}
  
  ngOnInit(): void {
    this.loadPrescriptions();
  }
  
  loadPrescriptions(): void {
    if (!this.patient) return;
    
    this.loading = true;
    this.patientService.getPatientPrescriptions(this.patient.id).subscribe({
      next: (prescriptions) => {
        this.prescriptions = prescriptions;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading prescriptions:', error);
        this.loading = false;
      }
    });
  }
  
  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'active':
        return 'bg-status-success/10 text-status-success';
      case 'draft':
        return 'bg-status-info/10 text-status-info';
      case 'completed':
        return 'bg-muted/10 text-muted';
      case 'cancelled':
        return 'bg-status-urgent/10 text-status-urgent';
      default:
        return 'bg-text-muted/10 text-text-muted';
    }
  }
  
  navigateToPrescription(prescriptionId: number): void {
    this.router.navigate(['/prescription', prescriptionId]);
  }

  createNewPrescription(): void {
    this.router.navigate(['/prescription/new'], { 
      queryParams: { patientId: this.patient?.id } 
    });
  }
}
