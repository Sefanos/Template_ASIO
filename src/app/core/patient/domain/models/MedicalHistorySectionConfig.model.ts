import { MedicalHistoryData } from "./MedicalHistoryData.model";

interface MedicalHistorySectionConfig {
    // Ajustement pour correspondre aux clés de MedicalHistoryData qui sont des string[]
    key: keyof Pick<MedicalHistoryData, 'currentMedicalConditions' | 'pastSurgeries' | 'chronicDiseases' | 'currentMedications' | 'allergies'>;
    title: string;
    color: string;
    emptyText: string;
    data: string[] | undefined;
  }