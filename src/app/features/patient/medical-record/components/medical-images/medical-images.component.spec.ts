import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MedicalImagesComponent } from './medical-images.component';

describe('MedicalImagesComponent', () => {
  let component: MedicalImagesComponent;
  let fixture: ComponentFixture<MedicalImagesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MedicalImagesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MedicalImagesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
