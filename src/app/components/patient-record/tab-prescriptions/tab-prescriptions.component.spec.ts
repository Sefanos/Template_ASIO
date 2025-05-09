import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TabPrescriptionsComponent } from './tab-prescriptions.component';

describe('TabPrescriptionsComponent', () => {
  let component: TabPrescriptionsComponent;
  let fixture: ComponentFixture<TabPrescriptionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabPrescriptionsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TabPrescriptionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
