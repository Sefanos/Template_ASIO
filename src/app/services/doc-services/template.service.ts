import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface PrescriptionTemplate {
  id?: number;
  name: string;
  medication: string;
  dosage: string;
  form: string;
  instructions: string;
  quantity: number;
  refills: number;
  doctor_id?: number;
  is_public?: boolean;
  created_at?: string;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TemplateService {
  private readonly API_URL = `${environment.apiUrl}/prescription-templates`;
  
  // ✅ Local storage for templates (for now)
  private readonly STORAGE_KEY = 'prescription_templates';
  
  // ✅ BehaviorSubject for real-time updates
  private templatesSubject = new BehaviorSubject<PrescriptionTemplate[]>([]);
  public templates$ = this.templatesSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadTemplatesFromStorage();
  }

  /**
   * Get all templates for current doctor
   */
  getTemplates(): Observable<PrescriptionTemplate[]> {
    // For now, use local storage
    // In production, this would be: return this.http.get<{success: boolean, data: PrescriptionTemplate[]}>(`${this.API_URL}`)
    
    const templates = this.getTemplatesFromStorage();
    this.templatesSubject.next(templates);
    return of(templates);
  }

  /**
   * Save a new template
   */
  saveTemplate(template: Omit<PrescriptionTemplate, 'id' | 'created_at' | 'updated_at'>): Observable<PrescriptionTemplate> {
    // For now, use local storage
    // In production, this would be: return this.http.post<{success: boolean, data: PrescriptionTemplate}>(`${this.API_URL}`, template)
    
    const newTemplate: PrescriptionTemplate = {
      ...template,
      id: Date.now(), // Simple ID generation
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const templates = this.getTemplatesFromStorage();
    templates.push(newTemplate);
    this.saveTemplatesToStorage(templates);
    this.templatesSubject.next(templates);

    return of(newTemplate);
  }

  /**
   * Update existing template
   */
  updateTemplate(id: number, updates: Partial<PrescriptionTemplate>): Observable<PrescriptionTemplate> {
    const templates = this.getTemplatesFromStorage();
    const index = templates.findIndex(t => t.id === id);
    
    if (index === -1) {
      throw new Error('Template not found');
    }

    templates[index] = {
      ...templates[index],
      ...updates,
      updated_at: new Date().toISOString()
    };

    this.saveTemplatesToStorage(templates);
    this.templatesSubject.next(templates);

    return of(templates[index]);
  }

  /**
   * Delete template
   */
  deleteTemplate(id: number): Observable<boolean> {
    const templates = this.getTemplatesFromStorage();
    const filteredTemplates = templates.filter(t => t.id !== id);
    
    this.saveTemplatesToStorage(filteredTemplates);
    this.templatesSubject.next(filteredTemplates);

    return of(true);
  }

  /**
   * Get template by ID
   */
  getTemplate(id: number): Observable<PrescriptionTemplate | null> {
    const templates = this.getTemplatesFromStorage();
    const template = templates.find(t => t.id === id);
    return of(template || null);
  }

  /**
   * Search templates by medication name
   */
  searchTemplates(query: string): Observable<PrescriptionTemplate[]> {
    const templates = this.getTemplatesFromStorage();
    const filtered = templates.filter(t => 
      t.name.toLowerCase().includes(query.toLowerCase()) ||
      t.medication.toLowerCase().includes(query.toLowerCase())
    );
    return of(filtered);
  }

  // ✅ Private methods for local storage
  private getTemplatesFromStorage(): PrescriptionTemplate[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : this.getDefaultTemplates();
    } catch {
      return this.getDefaultTemplates();
    }
  }

  private saveTemplatesToStorage(templates: PrescriptionTemplate[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(templates));
    } catch (error) {
      console.error('Error saving templates to storage:', error);
    }
  }

  private loadTemplatesFromStorage(): void {
    const templates = this.getTemplatesFromStorage();
    this.templatesSubject.next(templates);
  }

  private getDefaultTemplates(): PrescriptionTemplate[] {
    return [
      {
        id: 1,
        name: 'Amoxicillin - Respiratory Infection',
        medication: 'Amoxicillin',
        dosage: '500mg',
        form: 'capsule',
        instructions: 'Take one capsule by mouth three times a day for 10 days',
        quantity: 30,
        refills: 0,
        is_public: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 2,
        name: 'Lisinopril - Hypertension',
        medication: 'Lisinopril',
        dosage: '10mg',
        form: 'tablet',
        instructions: 'Take one tablet by mouth daily',
        quantity: 30,
        refills: 3,
        is_public: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 3,
        name: 'Metformin - Type 2 Diabetes',
        medication: 'Metformin',
        dosage: '500mg',
        form: 'tablet',
        instructions: 'Take one tablet by mouth twice daily with meals',
        quantity: 60,
        refills: 3,
        is_public: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
  }
}