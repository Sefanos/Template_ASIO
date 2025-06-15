import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Prescription } from '../../../../models/prescription.model';
import { PatientService } from '../../../../shared/services/patient.service';

@Component({
  selector: 'app-current-prescriptions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './current-prescriptions.component.html',
  styleUrl: './current-prescriptions.component.css'
})
export class CurrentPrescriptionsComponent implements OnInit {
  @Input() patientId: number | null = null;
  @Output() editRequested = new EventEmitter<Prescription>();
  
  showAll = false;
  prescriptions: Prescription[] = [];
  loading = false;
  
  constructor(private patientService: PatientService) {}
  
  ngOnInit(): void {
    this.loadPrescriptions();
  }
  
  loadPrescriptions(): void {
    if (!this.patientId) return;
    
    this.loading = true;
    this.patientService.getPatientPrescriptions(this.patientId).subscribe({
      next: (prescriptions) => {
        this.prescriptions = prescriptions;
      },
      error: (error) => {
        console.error('Error loading prescriptions:', error);
      },
      complete: () => {
        this.loading = false;
      }
    });
  }
  
  get displayedPrescriptions(): Prescription[] {
    if (this.showAll) {
      return this.prescriptions;
    } else {
      return this.prescriptions.filter(p => p.status === 'active');
    }
  }
  
  showAllPrescriptions(): void {
    this.showAll = !this.showAll;
  }
  
  editPrescription(prescription: Prescription): void {
    this.editRequested.emit(prescription);
  }
    cancelPrescription(prescription: Prescription): void {
    if (!prescription.id) return;
    
    if (confirm(`Êtes-vous sûr de vouloir annuler la prescription pour ${prescription.medication} ?`)) {
      this.patientService.cancelPrescription(prescription.id).subscribe({
        next: (success) => {
          if (success) {
            // Update the local prescription status
            const index = this.prescriptions.findIndex(p => p.id === prescription.id);
            if (index !== -1) {
              this.prescriptions[index].status = 'cancelled';
            }
            console.log('Prescription annulée avec succès');
          } else {
            console.error('Échec de l\'annulation de la prescription');
          }
        },
        error: (error) => {
          console.error('Erreur lors de l\'annulation de la prescription:', error);
        }
      });
    }
  }
  
  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'active':
        return 'bg-status-success/10 text-status-success';
      case 'draft':
        return 'bg-status-info/10 text-status-info';
      case 'completed':
        return 'bg-primary/10 text-primary';
      case 'cancelled':
        return 'bg-status-urgent/10 text-status-urgent';
      default:
        return 'bg-text/10 text-text';
    }
  }
    formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
}
