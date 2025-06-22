import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { LabResult, CreateLabResultRequest, LabResultFilter, LabTestTemplate } from '../../models/lab-result.model';

@Injectable({
  providedIn: 'root'
})
export class LabResultService {
  private readonly API_URL = `${environment.apiUrl}/lab-results`;

  constructor(private http: HttpClient) {}

  /**
   * Get all lab results for a patient
   */
  getLabResults(patientId: number, filters?: LabResultFilter): Observable<LabResult[]> {
    let params = new HttpParams().set('patient_id', patientId.toString());
    
    if (filters) {
      if (filters.testName) params = params.set('test_name', filters.testName);
      if (filters.dateFrom) params = params.set('date_from', filters.dateFrom);
      if (filters.dateTo) params = params.set('date_to', filters.dateTo);
      if (filters.status) params = params.set('status', filters.status);
      if (filters.abnormalOnly) params = params.set('abnormal_only', 'true');
    }

    return this.http.get<{success: boolean, data: LabResult[], message: string}>(`${this.API_URL}`, { params })
      .pipe(
        map(response => {
          if (response.success) {
            return response.data.map(result => this.transformLabResult(result));
          } else {
            throw new Error(response.message || 'Failed to fetch lab results');
          }
        }),
        catchError(error => {
          console.error('Error fetching lab results:', error);
          return throwError(() => new Error(error.error?.message || error.message || 'Failed to fetch lab results'));
        })
      );
  }

  /**
   * Get a specific lab result by ID
   */
  getLabResult(resultId: number): Observable<LabResult> {
    return this.http.get<{success: boolean, data: LabResult, message: string}>(`${this.API_URL}/${resultId}`)
      .pipe(
        map(response => {
          if (response.success) {
            return this.transformLabResult(response.data);
          } else {
            throw new Error(response.message || 'Failed to fetch lab result');
          }
        }),
        catchError(error => {
          console.error('Error fetching lab result:', error);
          return throwError(() => new Error(error.error?.message || error.message || 'Failed to fetch lab result'));
        })
      );
  }

  /**
   * Create a new lab result
   */
  createLabResult(labResult: CreateLabResultRequest): Observable<LabResult> {
    return this.http.post<{success: boolean, data: LabResult, message: string}>(this.API_URL, labResult)
      .pipe(
        map(response => {
          if (response.success) {
            return this.transformLabResult(response.data);
          } else {
            throw new Error(response.message || 'Failed to create lab result');
          }
        }),
        catchError(error => {
          console.error('Error creating lab result:', error);
          return throwError(() => new Error(error.error?.message || error.message || 'Failed to create lab result'));
        })
      );
  }

  /**
   * Update an existing lab result
   */
  updateLabResult(resultId: number, updates: Partial<CreateLabResultRequest>): Observable<LabResult> {
    return this.http.put<{success: boolean, data: LabResult, message: string}>(`${this.API_URL}/${resultId}`, updates)
      .pipe(
        map(response => {
          if (response.success) {
            return this.transformLabResult(response.data);
          } else {
            throw new Error(response.message || 'Failed to update lab result');
          }
        }),
        catchError(error => {
          console.error('Error updating lab result:', error);
          return throwError(() => new Error(error.error?.message || error.message || 'Failed to update lab result'));
        })
      );
  }

  /**
   * Delete a lab result
   */
  deleteLabResult(resultId: number): Observable<boolean> {
    return this.http.delete<{success: boolean, message: string}>(`${this.API_URL}/${resultId}`)
      .pipe(
        map(response => response.success),
        catchError(error => {
          console.error('Error deleting lab result:', error);
          return throwError(() => new Error(error.error?.message || error.message || 'Failed to delete lab result'));
        })
      );
  }

  /**
   * Get trending data for a specific parameter
   */
  getParameterTrend(patientId: number, parameterName: string, months: number = 12): Observable<LabResult[]> {
    const fromDate = new Date();
    fromDate.setMonth(fromDate.getMonth() - months);
    
    const filters: LabResultFilter = {
      dateFrom: fromDate.toISOString().split('T')[0],
      dateTo: new Date().toISOString().split('T')[0]
    };

    return this.getLabResults(patientId, filters).pipe(
      map(results => results.filter(result => 
        result.structured_results.results.some(param => 
          (param.parameter || param.name) === parameterName
        )
      ))
    );
  }

  /**
   * Get available lab test templates
   */
  getLabTestTemplates(): Observable<LabTestTemplate[]> {
    // For now, return static templates
    // In production, this would call an API endpoint
    return new Observable(observer => {
      observer.next(this.getDefaultLabTemplates());
      observer.complete();
    });
  }
  /**
   * Transform lab result from API format to frontend format
   */
  private transformLabResult(apiResult: any): LabResult {
    // Ensure structured_results exists
    const structuredResults = apiResult.structured_results || { results: [] };
    
    // Normalize parameter names
    const normalizedResults = (structuredResults.results || []).map((param: any) => ({
      name: param.parameter || param.name || 'Unknown Parameter',
      parameter: param.parameter || param.name || 'Unknown Parameter',
      value: param.value || 'N/A',
      unit: param.unit || '',
      reference_range: param.reference_range || param.referenceRange || 'N/A',
      referenceRange: param.reference_range || param.referenceRange || 'N/A',
      status: param.status || 'normal'
    }));

    return {
      ...apiResult,
      structured_results: {
        results: normalizedResults
      },
      testName: this.extractTestName(apiResult),
      testCode: this.extractTestCode(apiResult),
      labName: this.extractLabName(apiResult),
      reviewedBy: this.extractReviewedBy(apiResult),
      hasDocument: !!apiResult.result_document_path,
      // Ensure all required fields have fallback values
      performed_by_lab_name: apiResult.performed_by_lab_name || apiResult.lab_name || 'Unknown Lab',
      interpretation: apiResult.interpretation || apiResult.clinical_interpretation || null
    };
  }

  /**
   * Extract test name from lab result data
   */
  private extractTestName(result: any): string {
    if (result.testName) return result.testName;
    if (result.lab_test_name) return result.lab_test_name;
    if (result.test_name) return result.test_name;
    if (result.name) return result.name;
    
    // Try to infer from structured results
    const firstParam = result.structured_results?.results?.[0];
    if (firstParam && (firstParam.test_name || firstParam.test_type)) {
      return firstParam.test_name || firstParam.test_type;
    }
    
    return 'Lab Test';
  }

  /**
   * Extract test code from lab result data
   */
  private extractTestCode(result: any): string {
    if (result.testCode) return result.testCode;
    if (result.lab_test_code) return result.lab_test_code;
    if (result.test_code) return result.test_code;
    if (result.code) return result.code;
    return '';
  }

  /**
   * Extract lab name from lab result data
   */
  private extractLabName(result: any): string {
    if (result.labName) return result.labName;
    if (result.performed_by_lab_name) return result.performed_by_lab_name;
    if (result.lab_name) return result.lab_name;
    if (result.laboratory_name) return result.laboratory_name;
    return 'Unknown Lab';
  }

  /**
   * Extract reviewed by information
   */
  private extractReviewedBy(result: any): string {
    if (result.reviewedBy) return result.reviewedBy;
    if (result.reviewed_by_name) return result.reviewed_by_name;
    if (result.doctor_name) return result.doctor_name;
    if (result.physician_name) return result.physician_name;
    if (result.reviewed_by_user_id) return `Doctor (ID: ${result.reviewed_by_user_id})`;
    return '';
  }

  /**
   * Get default lab test templates
   */
  private getDefaultLabTemplates(): LabTestTemplate[] {
    return [
      {
        id: 'lipid-panel',
        name: 'Lipid Panel',
        code: 'LIP',
        category: 'Chemistry',
        description: 'Comprehensive cholesterol and triglyceride analysis',
        parameters: [
          { name: 'Total Cholesterol', unit: 'mg/dL', reference_range: '<200', type: 'numeric', normal_range: { max: 200 } },
          { name: 'LDL Cholesterol', unit: 'mg/dL', reference_range: '<100', type: 'numeric', normal_range: { max: 100 } },
          { name: 'HDL Cholesterol', unit: 'mg/dL', reference_range: '>40', type: 'numeric', normal_range: { min: 40 } },
          { name: 'Triglycerides', unit: 'mg/dL', reference_range: '<150', type: 'numeric', normal_range: { max: 150 } }
        ]
      },
      {
        id: 'cbc',
        name: 'Complete Blood Count (CBC)',
        code: 'CBC',
        category: 'Hematology',
        description: 'Comprehensive blood cell analysis',
        parameters: [
          { name: 'White Blood Cells', unit: 'K/uL', reference_range: '4.5-11.0', type: 'numeric', normal_range: { min: 4.5, max: 11.0 } },
          { name: 'Red Blood Cells', unit: 'M/uL', reference_range: '4.2-5.9', type: 'numeric', normal_range: { min: 4.2, max: 5.9 } },
          { name: 'Hemoglobin', unit: 'g/dL', reference_range: '12.0-17.0', type: 'numeric', normal_range: { min: 12.0, max: 17.0 } },
          { name: 'Hematocrit', unit: '%', reference_range: '36-50', type: 'numeric', normal_range: { min: 36, max: 50 } },
          { name: 'Platelets', unit: 'K/uL', reference_range: '150-450', type: 'numeric', normal_range: { min: 150, max: 450 } }
        ]
      },
      {
        id: 'bmp',
        name: 'Basic Metabolic Panel (BMP)',
        code: 'BMP',
        category: 'Chemistry',
        description: 'Essential electrolytes and kidney function',
        parameters: [
          { name: 'Glucose', unit: 'mg/dL', reference_range: '70-100', type: 'numeric', normal_range: { min: 70, max: 100 } },
          { name: 'Sodium', unit: 'mEq/L', reference_range: '136-145', type: 'numeric', normal_range: { min: 136, max: 145 } },
          { name: 'Potassium', unit: 'mEq/L', reference_range: '3.5-5.1', type: 'numeric', normal_range: { min: 3.5, max: 5.1 } },
          { name: 'Chloride', unit: 'mEq/L', reference_range: '98-107', type: 'numeric', normal_range: { min: 98, max: 107 } },
          { name: 'BUN', unit: 'mg/dL', reference_range: '7-20', type: 'numeric', normal_range: { min: 7, max: 20 } },
          { name: 'Creatinine', unit: 'mg/dL', reference_range: '0.6-1.2', type: 'numeric', normal_range: { min: 0.6, max: 1.2 } }
        ]
      }
    ];
  }

  /**
   * Get sample lab results for development/testing
   * This can be used as fallback data when API is not available
   */
  getSampleLabResults(): LabResult[] {
    const today = new Date();
    const lastWeek = new Date(today);
    lastWeek.setDate(today.getDate() - 7);
    const lastMonth = new Date(today);
    lastMonth.setMonth(today.getMonth() - 1);

    return [
      {
        id: 1,
        patient_id: 1,
        lab_test_id: 1,
        result_date: today.toISOString(),
        performed_by_lab_name: 'City Medical Lab',
        result_document_path: '/documents/lab-reports/lipid-panel-2025-06-21.pdf',
        structured_results: {
          results: [
            { name: 'Total Cholesterol', parameter: 'Total Cholesterol', value: '240', unit: 'mg/dL', reference_range: '<200', referenceRange: '<200', status: 'high' },
            { name: 'LDL Cholesterol', parameter: 'LDL Cholesterol', value: '160', unit: 'mg/dL', reference_range: '<100', referenceRange: '<100', status: 'high' },
            { name: 'HDL Cholesterol', parameter: 'HDL Cholesterol', value: '35', unit: 'mg/dL', reference_range: '>40', referenceRange: '>40', status: 'low' },
            { name: 'Triglycerides', parameter: 'Triglycerides', value: '280', unit: 'mg/dL', reference_range: '<150', referenceRange: '<150', status: 'high' }
          ]
        },
        interpretation: 'Elevated cholesterol levels indicate increased cardiovascular risk. Recommend dietary modifications and consider statin therapy.',
        reviewed_by_user_id: 1,
        status: 'completed',
        created_at: today.toISOString(),
        updated_at: today.toISOString(),
        testName: 'Lipid Panel',
        testCode: 'LIP',
        labName: 'City Medical Lab',
        reviewedBy: 'Dr. Sarah Johnson',
        hasDocument: true
      },
      {
        id: 2,
        patient_id: 1,
        lab_test_id: 2,
        result_date: lastWeek.toISOString(),
        performed_by_lab_name: 'Regional Health Labs',
        structured_results: {
          results: [
            { name: 'White Blood Cells', parameter: 'White Blood Cells', value: '7.5', unit: 'K/uL', reference_range: '4.5-11.0', referenceRange: '4.5-11.0', status: 'normal' },
            { name: 'Red Blood Cells', parameter: 'Red Blood Cells', value: '4.8', unit: 'M/uL', reference_range: '4.2-5.9', referenceRange: '4.2-5.9', status: 'normal' },
            { name: 'Hemoglobin', parameter: 'Hemoglobin', value: '14.2', unit: 'g/dL', reference_range: '12.0-17.0', referenceRange: '12.0-17.0', status: 'normal' },
            { name: 'Hematocrit', parameter: 'Hematocrit', value: '42.5', unit: '%', reference_range: '36-50', referenceRange: '36-50', status: 'normal' },
            { name: 'Platelets', parameter: 'Platelets', value: '325', unit: 'K/uL', reference_range: '150-450', referenceRange: '150-450', status: 'normal' }
          ]
        },
        interpretation: 'All blood count parameters are within normal limits.',
        reviewed_by_user_id: 2,
        status: 'completed',
        created_at: lastWeek.toISOString(),
        updated_at: lastWeek.toISOString(),
        testName: 'Complete Blood Count (CBC)',
        testCode: 'CBC',
        labName: 'Regional Health Labs',
        reviewedBy: 'Dr. Michael Chen',
        hasDocument: false
      },
      {
        id: 3,
        patient_id: 1,
        lab_test_id: 3,
        result_date: lastMonth.toISOString(),
        performed_by_lab_name: 'Metro Diagnostics',
        structured_results: {
          results: [
            { name: 'Glucose', parameter: 'Glucose', value: '165', unit: 'mg/dL', reference_range: '70-100', referenceRange: '70-100', status: 'high' },
            { name: 'Sodium', parameter: 'Sodium', value: '142', unit: 'mEq/L', reference_range: '136-145', referenceRange: '136-145', status: 'normal' },
            { name: 'Potassium', parameter: 'Potassium', value: '4.2', unit: 'mEq/L', reference_range: '3.5-5.1', referenceRange: '3.5-5.1', status: 'normal' },
            { name: 'Chloride', parameter: 'Chloride', value: '103', unit: 'mEq/L', reference_range: '98-107', referenceRange: '98-107', status: 'normal' },
            { name: 'BUN', parameter: 'BUN', value: '18', unit: 'mg/dL', reference_range: '7-20', referenceRange: '7-20', status: 'normal' },
            { name: 'Creatinine', parameter: 'Creatinine', value: '1.1', unit: 'mg/dL', reference_range: '0.6-1.2', referenceRange: '0.6-1.2', status: 'normal' }
          ]
        },
        interpretation: 'Elevated glucose suggests impaired glucose tolerance or diabetes. Follow-up with HbA1c recommended.',
        reviewed_by_user_id: 1,
        status: 'completed',
        created_at: lastMonth.toISOString(),
        updated_at: lastMonth.toISOString(),
        testName: 'Basic Metabolic Panel (BMP)',
        testCode: 'BMP',
        labName: 'Metro Diagnostics',
        reviewedBy: 'Dr. Sarah Johnson',
        hasDocument: false
      }
    ];
  }
}