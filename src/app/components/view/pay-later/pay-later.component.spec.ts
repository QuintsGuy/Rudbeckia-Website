import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PayLaterComponent } from './pay-later.component';

describe('PayLaterComponent', () => {
  let component: PayLaterComponent;
  let fixture: ComponentFixture<PayLaterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PayLaterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PayLaterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
