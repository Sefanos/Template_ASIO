import { TestBed } from '@angular/core/testing';

import { LabResultServiceService } from './lab-result-service.service';

describe('LabResultServiceService', () => {
  let service: LabResultServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LabResultServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
