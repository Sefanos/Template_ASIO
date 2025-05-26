export interface AiAnalysisResult {
  timestamp: string;
  request_id: string;
  condition_type: string;
  ml_prediction: MlPredictionResult;
  llm_analysis: string;
  medical_context: MedicalContext;
  model_info: ModelInfo;
  analysis_id: number;
}

export interface MlPredictionResult {
  predicted_class: string;
  confidence: number;
  diagnosis: string;
  probability: number;
  // Note: class_probabilities is not in the actual response
}

export interface MedicalContext {
  description: string;
  risk_factors: string[];
  follow_up_tests: string[];
  image_type: string;
}

export interface ModelInfo {
  ml_model: string;
  llm_model: {
    model: string;
    temperature: number;
    max_tokens: number;
    type: string;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}