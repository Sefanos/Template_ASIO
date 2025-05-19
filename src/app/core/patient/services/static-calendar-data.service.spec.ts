import { TestBed } from '@angular/core/testing';

import { StaticCalendarDataService } from './static-calendar-data.service';

describe('StaticCalendarDataService', () => {
  let service: StaticCalendarDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StaticCalendarDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
