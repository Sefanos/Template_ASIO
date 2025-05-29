import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NouveauRdvComponent } from './nouveau-rdv.component';

describe('NouveauRdvComponent', () => {
  let component: NouveauRdvComponent;
  let fixture: ComponentFixture<NouveauRdvComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [NouveauRdvComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NouveauRdvComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
