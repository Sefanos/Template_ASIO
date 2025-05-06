import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AiDiagnosticComponent } from './ai-diagnostic.component';

describe('AiDiagnosticComponent', () => {
  let component: AiDiagnosticComponent;
  let fixture: ComponentFixture<AiDiagnosticComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AiDiagnosticComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AiDiagnosticComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
