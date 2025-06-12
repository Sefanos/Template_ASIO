import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BillDetailModalComponent } from './bill-detail-modal.component';

describe('BillDetailModalComponent', () => {
  let component: BillDetailModalComponent;
  let fixture: ComponentFixture<BillDetailModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BillDetailModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BillDetailModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
