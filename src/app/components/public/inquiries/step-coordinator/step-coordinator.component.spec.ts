import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StepCoordinatorComponent } from './step-coordinator.component';

describe('StepCoordinatorComponent', () => {
  let component: StepCoordinatorComponent;
  let fixture: ComponentFixture<StepCoordinatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StepCoordinatorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StepCoordinatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
