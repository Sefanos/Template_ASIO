import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SharedCalendarComponent } from './shared-calendar.component';

describe('SharedCalendarComponent', () => {
  let component: SharedCalendarComponent;
  let fixture: ComponentFixture<SharedCalendarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SharedCalendarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SharedCalendarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
