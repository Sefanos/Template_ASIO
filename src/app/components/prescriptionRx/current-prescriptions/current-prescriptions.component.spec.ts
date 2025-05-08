import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CurrentPrescriptionsComponent } from './current-prescriptions.component';

describe('CurrentPrescriptionsComponent', () => {
  let component: CurrentPrescriptionsComponent;
  let fixture: ComponentFixture<CurrentPrescriptionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CurrentPrescriptionsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CurrentPrescriptionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
