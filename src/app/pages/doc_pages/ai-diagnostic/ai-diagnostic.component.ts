import { Component, OnInit } from '@angular/core';
import { CommonModule, KeyValue } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { PatientService } from '../../../shared/services/patient.service';
import { AiDiagnosticService } from '../../../services/doc-services/AiDiagnosticService';
import { Patient } from '../../../models/patient.model';
import { AiAnalysisResult } from '../../../models/ai-analysis.model';
import { finalize } from 'rxjs/operators';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import * as marked from 'marked';

@Component({
  selector: 'app-ai-diagnostic',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule
  ],
  templateUrl: './ai-diagnostic.component.html',
  styleUrl: './ai-diagnostic.component.css'
})
export class AiDiagnosticComponent implements OnInit {
  uploadForm: FormGroup;
  patients: Patient[] = [];
  searchQuery: string = '';
  filteredPatients: Patient[] = [];
  selectedPatient: Patient | null = null;
  
  isAnalyzing = false;
  analysisResult: AiAnalysisResult | null = null;
  uploadedImage: string | ArrayBuffer | null = null;
  errorMessage: string = '';
  
  conditionTypes = [
    { value: 'melanoma', label: 'Analyse de Lésion Cutanée (Mélanome)' },
    { value: 'brain', label: 'Analyse IRM Cérébrale' },
    { value: 'pneumonia', label: 'Analyse Radiographie Thoracique (Pneumonie)' }
  ];

  constructor(
    private fb: FormBuilder,
    private patientService: PatientService,
    private aiDiagnosticService: AiDiagnosticService,
    private sanitizer: DomSanitizer
  ) {
    this.uploadForm = this.fb.group({
      image: ['', [Validators.required]],
      conditionType: ['melanoma', [Validators.required]],
      patientId: [null],
      summaryMode: [true]
    });
  }

  ngOnInit(): void {
    this.loadPatients();
  }

  loadPatients(): void {
    this.patientService.getAllPatients().subscribe({
      next: (data) => {
        this.patients = data;
        this.filteredPatients = [...this.patients];
      },
      error: (error) => {
        console.error('Error fetching patients:', error);
      }
    });
  }

  searchPatients(): void {
    if (!this.searchQuery.trim()) {
      this.filteredPatients = [...this.patients];
      return;
    }
    
    const query = this.searchQuery.toLowerCase();
    this.filteredPatients = this.patients.filter(patient => 
      patient.name.toLowerCase().includes(query) || 
      patient.id.toString().includes(query)
    );
  }

  selectPatient(patient: Patient): void {
    this.selectedPatient = patient;
    this.uploadForm.patchValue({ patientId: patient.id });
    this.searchQuery = '';
  }

  clearSelectedPatient(): void {
    this.selectedPatient = null;
    this.uploadForm.patchValue({ patientId: null });
  }

  onImageSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.uploadForm.patchValue({ image: file });
      
      // Display preview
      const reader = new FileReader();
      reader.onload = () => {
        this.uploadedImage = reader.result;
      };
      reader.readAsDataURL(file);
    }
  }

  analyzeImage(): void {
    if (this.uploadForm.invalid) {
      this.errorMessage = 'Veuillez sélectionner une image et un type de condition.';
      return;
    }

    this.isAnalyzing = true;
    this.errorMessage = '';
    this.analysisResult = null;
    
    const formData = new FormData();
    formData.append('image', this.uploadForm.get('image')?.value);
    formData.append('condition_type', this.uploadForm.get('conditionType')?.value);
    formData.append('summary_mode', this.uploadForm.get('summaryMode')?.value ? '1' : '0');
    
    if (this.uploadForm.get('patientId')?.value) {
      formData.append('patient_id', this.uploadForm.get('patientId')?.value);
    }

    this.aiDiagnosticService.analyzeImage(formData)
      .pipe(
        finalize(() => {
          this.isAnalyzing = false;
        })
      )
      .subscribe({
        next: (response) => {
          this.analysisResult = response.data;
        },
        error: (error) => {
          console.error('Error during image analysis:', error);
          this.errorMessage = error.error?.message || 'Une erreur est survenue pendant l\'analyse. Veuillez réessayer.';
        }
      });
  }

  resetForm(): void {
    this.uploadForm.reset({
      conditionType: 'melanoma',
      summaryMode: true
    });
    this.uploadedImage = null;
    this.analysisResult = null;
    this.errorMessage = '';
    this.clearSelectedPatient();
  }

  formatMarkdown(text: string): SafeHtml {
    if (!text) return '';
    // Use marked.parse instead of marked directly
    const html = marked.parse(text);
    
    // Check if html is a Promise and handle it accordingly
    if (html instanceof Promise) {
      // Return empty initially, consider using an async approach if needed
      return '';
    } else {
      return this.sanitizer.bypassSecurityTrustHtml(html);
    }
  }

  formatTimestamp(timestamp: string): string {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleString();
  }

  getConfidenceColorClass(confidence: number): string {
    if (confidence >= 0.8) return 'text-status-success';
    if (confidence >= 0.6) return 'text-status-warning';
    return 'text-status-error';
  }

  getPredictionColorClass(prediction: string): string {
    if (prediction.toLowerCase().includes('not') || 
        prediction.toLowerCase().includes('benign')) {
      return 'text-status-success';
    }
    return 'text-status-error';
  }
    
  // Preserve original property order when iterating through class_probabilities
  originalOrder = (a: KeyValue<string, number>, b: KeyValue<string, number>): number => {
    return 0;
  }
}