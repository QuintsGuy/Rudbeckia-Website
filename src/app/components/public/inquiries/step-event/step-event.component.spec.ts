import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StepEventComponent } from './step-event.component';

describe('StepEventComponent', () => {
  let component: StepEventComponent;
  let fixture: ComponentFixture<StepEventComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StepEventComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StepEventComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
