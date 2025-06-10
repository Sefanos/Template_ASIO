import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RevenueTimelineComponent } from './revenue-timeline.component';

describe('RevenueTimelineComponent', () => {
  let component: RevenueTimelineComponent;
  let fixture: ComponentFixture<RevenueTimelineComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RevenueTimelineComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RevenueTimelineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
