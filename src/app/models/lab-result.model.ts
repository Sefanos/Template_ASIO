export interface LabResult {
  id: number;
  patient_id: number;
  lab_test_id?: number;
  medical_record_id?: number;
  result_date: string;
  performed_by_lab_name?: string;
  result_document_path?: string;
  structured_results: {
    results: LabParameter[];
  };
  interpretation?: string;
  reviewed_by_user_id?: number;
  status: 'completed' | 'pending' | 'cancelled' | 'in_progress';
  created_at: string;
  updated_at: string;
  
  // Computed properties for display
  testName?: string;
  testCode?: string;
  labName?: string;
  reviewedBy?: string;
  hasDocument?: boolean;
}

export interface LabParameter {
  parameter?: string; // API uses 'parameter'
  name?: string;      // Display uses 'name'
  value: string;
  unit: string;
  reference_range?: string;
  referenceRange?: string; // Alternative naming
  status: 'normal' | 'high' | 'low' | 'borderline' | 'critical';
}

export interface CreateLabResultRequest {
  patient_id: number;
  test_name: string;
  result_date: string;
  performed_by_lab_name?: string;
  structured_results: {
    results: LabParameter[];
  };
  interpretation?: string;
  status: 'completed' | 'pending' | 'cancelled' | 'in_progress';
}

export interface LabTestTemplate {
  id: string;
  name: string;
  code: string;
  category: string;
  parameters: LabParameterTemplate[];
  description?: string;
}

export interface LabParameterTemplate {
  name: string;
  unit: string;
  reference_range: string;
  type: 'numeric' | 'text' | 'select';
  options?: string[]; // For select type
  normal_range?: {
    min?: number;
    max?: number;
  };
}

export interface LabResultFilter {
  testName?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  parameterName?: string;
  abnormalOnly?: boolean;
}

export interface LabResultTrend {
  parameter: string;
  unit: string;
  values: LabTrendPoint[];
  trend: 'improving' | 'worsening' | 'stable' | 'unclear';
}

export interface LabTrendPoint {
  date: string;
  value: number;
  status: string;
  testName: string;
}