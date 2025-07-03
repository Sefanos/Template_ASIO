export interface PatientFile {
  id: number;
  type: 'document' | 'image' | 'video' | 'audio' | string;
  category: string;
  originalFilename: string;
  description: string | null;
  fileSize: number;
  fileSizeFormatted: string;
  mimeType: string;
  uploadedAt: string;
  uploadedBy: string;
  isVisibleToPatient: boolean;
  downloadUrl: string;
  categoryLabel: string;
  typeIcon: string;
}

export interface PatientFileApiResponse {
  success: boolean;
  message: string;
  data: PatientFile[];
}

export interface SinglePatientFileApiResponse {
  success: boolean;
  message: string;
  data: PatientFile;
}

export interface CategoriesApiResponse {
  success: boolean;
  message: string;
  data: { [key: string]: string };
}