import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VitalSignsComponent } from './vital-signs.component';

describe('VitalSignsComponent', () => {
  let component: VitalSignsComponent;
  let fixture: ComponentFixture<VitalSignsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [VitalSignsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VitalSignsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
