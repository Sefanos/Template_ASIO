import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModuleUsageHeatmapComponent } from './module-usage-heatmap.component';

describe('ModuleUsageHeatmapComponent', () => {
  let component: ModuleUsageHeatmapComponent;
  let fixture: ComponentFixture<ModuleUsageHeatmapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModuleUsageHeatmapComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModuleUsageHeatmapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
