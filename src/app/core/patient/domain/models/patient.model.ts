

import { PersonalInfo } from './personal-info.model';

export interface Patient {
  id: number;       // Patient's own ID
  userId: number;   // Associated User ID


  personalInfo: PersonalInfo;
}
