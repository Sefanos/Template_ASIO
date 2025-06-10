import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DoctorRevenueComponent } from './doctor-revenue.component';

describe('DoctorRevenueComponent', () => {
  let component: DoctorRevenueComponent;
  let fixture: ComponentFixture<DoctorRevenueComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DoctorRevenueComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DoctorRevenueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
