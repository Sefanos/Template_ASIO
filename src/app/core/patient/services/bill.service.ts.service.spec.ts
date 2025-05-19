import { TestBed } from '@angular/core/testing';

import { BillServiceTsService } from './bill.service.ts.service';

describe('BillServiceTsService', () => {
  let service: BillServiceTsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BillServiceTsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
