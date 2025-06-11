import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServiceRevenueComponent } from './service-revenue.component';

describe('ServiceRevenueComponent', () => {
  let component: ServiceRevenueComponent;
  let fixture: ComponentFixture<ServiceRevenueComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServiceRevenueComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ServiceRevenueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
