import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DoctorRevenueTableComponent } from './doctor-revenue-table.component';

describe('DoctorRevenueTableComponent', () => {
  let component: DoctorRevenueTableComponent;
  let fixture: ComponentFixture<DoctorRevenueTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DoctorRevenueTableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DoctorRevenueTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
