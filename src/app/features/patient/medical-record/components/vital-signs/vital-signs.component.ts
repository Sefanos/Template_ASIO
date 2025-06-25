import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { VitalSignsService } from '../../../../../core/patient/services/vital-signs.service';
import { VitalSign } from '../../../../../core/patient/domain/models/vital-signs.model';
import { ScaleType } from '@swimlane/ngx-charts';

@Component({
  selector: 'app-vital-signs',
  standalone: false,
  templateUrl: './vital-signs.component.html',
  styleUrls: ['./vital-signs.component.css'],
   
})
export class VitalSignsComponent implements OnInit {
  latestVitals: VitalSign | null = null;
  vitalsHistory: VitalSign[] = [];
  isLoading: boolean = true;
  error: string | null = null;
  private patientId = 1; // Contexte patient supposé

    // Visibilité des graphiques
showCharts: boolean = true;
    // Options pour les graphiques
  bloodPressureChartData: any[] = [];
  pulseChartData: any[] = [];
  weightChartData: any[] = [];

//  view: [number, number] = [700, 300]; // Dimensions du graphique
  legend: boolean = true;
  showLabels: boolean = true;
  animations: boolean = true;
  xAxis: boolean = true;
  yAxis: boolean = true;
  showYAxisLabel: boolean = true;
  showXAxisLabel: boolean = true;
  xAxisLabel: string = 'Date';
  yAxisLabelBP: string = 'Pressure (mmHg)';
  yAxisLabelPulse: string = 'Rate (bpm)';
  yAxisLabelWeight: string = 'Weight (kg)';


    // Couleurs personnalisées pour le graphique de tension
    // Couleurs personnalisées pour le graphique de tension
  bpColorScheme = {
    name: 'bloodPressure',
    selectable: true,
     group: ScaleType.Ordinal,
    domain: ['#ef4444', '#3b82f6'], // Rouge pour Systolique, Bleu pour Diastolique
  };



  // Pour la recherche
  searchTerm: string = '';
  
  // Pour la pagination
  filteredHistory: VitalSign[] = [];
  paginatedHistory: VitalSign[] = [];
  currentPage: number = 1;
  itemsPerPage: number = 5; // Afficher 7 éléments par page

  // Pour le modal
  selectedVitalSign: VitalSign | null = null;
  isModalOpen: boolean = false;


  
constructor(
    private vitalSignsService: VitalSignsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadVitalSigns();
  }
   loadVitalSigns(): void {
    this.isLoading = true;
    this.error = null;
    this.vitalSignsService.getVitalSigns(this.patientId).subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          // Les données sont supposées triées par date (la plus récente en premier)
          this.latestVitals = data[0];
          this.vitalsHistory = data;
          this.filteredHistory = data;
          this.prepareChartData(data);
          this.applyPagination();

        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
       error: (err) => {
        console.error('Error loading vital signs:', err);
        this.error = 'Failed to load vital signs. Please try again later.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onSearchChange(): void {
    this.currentPage = 1; // Revenir à la première page à chaque recherche
    const term = this.searchTerm.toLowerCase();
    
    if (!term) {
      this.filteredHistory = [...this.vitalsHistory];
    } else {
      this.filteredHistory = this.vitalsHistory.filter(record => {
        // Recherche simple sur la date et les notes
        const date = new Date(record.recorded_at).toLocaleDateString().toLowerCase();
        const notes = record.notes?.toLowerCase() || '';
        return date.includes(term) || notes.includes(term);
      });
    }
    this.applyPagination();
  }
  applyPagination(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedHistory = this.filteredHistory.slice(startIndex, endIndex);
    this.cdr.detectChanges();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.getTotalPages()) {
      this.currentPage = page;
      this.applyPagination();
    }
  }

  getTotalPages(): number {
    return Math.ceil(this.filteredHistory.length / this.itemsPerPage);
  }

  openModal(record: VitalSign): void {
    this.selectedVitalSign = record;
    this.isModalOpen = true;
  }
   closeModal(): void {
    this.isModalOpen = false;
    this.selectedVitalSign = null;
  }

   prepareChartData(data: VitalSign[]): void {
    // Inverser les données pour que le graphique aille du plus ancien au plus récent
    const reversedData = [...data].reverse();

    // Préparer les données pour le graphique de la tension artérielle
    this.bloodPressureChartData = [
      {
        name: 'Systolic',
        series: reversedData.map(v => ({
          name: new Date(v.recorded_at),
          value: v.blood_pressure_systolic,
        })),
      },
      {
        name: 'Diastolic',
        series: reversedData.map(v => ({
          name: new Date(v.recorded_at),
          value: v.blood_pressure_diastolic,
        })),
          },
    ];
     // Préparer les données pour le graphique du pouls
    this.pulseChartData = [{
      name: 'Pulse Rate',
      series: reversedData.map(v => ({
        name: new Date(v.recorded_at),
        value: v.pulse_rate,
      })),
    }];
     // Préparer les données pour le graphique du poids
    this.weightChartData = [{
      name: 'Weight',
      series: reversedData.map(v => ({
        name: new Date(v.recorded_at),
        value: parseFloat(v.weight),
      })),
    }];
  }

  getVitalSignIcon(vital: string): string {
    switch (vital) {
      case 'blood_pressure': return 'fas fa-heartbeat';
      case 'pulse_rate': return 'fas fa-tachometer-alt';
      case 'temperature': return 'fas fa-thermometer-half';
      case 'respiratory_rate': return 'fas fa-lungs';
      case 'oxygen_saturation': return 'fas fa-tint';
      case 'weight': return 'fas fa-weight';
      case 'height': return 'fas fa-ruler-vertical';
      default: return 'fas fa-notes-medical';
    }
  }


  /**
   * Retourne une classe CSS en fonction de la valeur de la tension.
   * (Ceci est un exemple simplifié)
   */
  getBPStatusClass(systolic: number, diastolic: number): string {
    if (systolic > 140 || diastolic > 90) {
      return 'text-status-urgent font-bold'; // Hypertension
    }
    if (systolic > 120 || diastolic > 80) {
      return 'text-status-warning font-medium'; // Élevée
    }
    return 'text-text-light'; // Normale
  }
}