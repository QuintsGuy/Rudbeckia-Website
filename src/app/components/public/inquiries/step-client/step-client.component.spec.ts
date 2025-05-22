import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StepClientComponent } from './step-client.component';

describe('StepClientComponent', () => {
  let component: StepClientComponent;
  let fixture: ComponentFixture<StepClientComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StepClientComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StepClientComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
