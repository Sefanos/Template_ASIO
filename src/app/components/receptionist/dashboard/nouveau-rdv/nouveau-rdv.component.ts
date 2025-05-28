import { Component } from '@angular/core';

@Component({
  selector: 'app-nouveau-rdv',
  templateUrl: './nouveau-rdv.component.html',
  styleUrls: ['./nouveau-rdv.component.css']
})
export class NouveauRdvComponent {
  rdv = {
    patient: '',
    medecin: '',
    date: '',
    heure: '',
    motif: ''
  };

  rdvs: any[] = [];

  onSubmit() {
    if (this.rdv.patient && this.rdv.medecin && this.rdv.date && this.rdv.heure) {
      this.rdvs.push({ ...this.rdv });
      this.resetForm();
    }
  }

  resetForm() {
    this.rdv = {
      patient: '',
      medecin: '',
      date: '',
      heure: '',
      motif: ''
    };
  }
}