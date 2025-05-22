import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StepPinterestComponent } from './step-pinterest.component';

describe('StepPinterestComponent', () => {
  let component: StepPinterestComponent;
  let fixture: ComponentFixture<StepPinterestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StepPinterestComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StepPinterestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
