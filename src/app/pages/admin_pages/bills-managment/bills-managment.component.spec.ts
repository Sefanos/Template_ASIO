import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BillsManagmentComponent } from './bills-managment.component';

describe('BillsManagmentComponent', () => {
  let component: BillsManagmentComponent;
  let fixture: ComponentFixture<BillsManagmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BillsManagmentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BillsManagmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
