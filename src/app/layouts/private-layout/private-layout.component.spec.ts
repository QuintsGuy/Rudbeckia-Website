import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { PrivateLayoutComponent } from './private-layout.component';
import { provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';

describe('PrivateLayoutComponent', () => {
  let component: PrivateLayoutComponent;
  let fixture: ComponentFixture<PrivateLayoutComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [PrivateLayoutComponent], // ✅ standalone component
      providers: [provideRouter([])],    // ✅ needed for router-outlet + ActivatedRoute
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PrivateLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the PrivateLayoutComponent', () => {
    expect(component).toBeTruthy();
  });

  it('should render the <app-sidebar> component', () => {
    const sidebar = fixture.debugElement.query(By.css('app-sidebar'));
    expect(sidebar).toBeTruthy();
  });

  it('should render the <router-outlet>', () => {
    const outlet = fixture.debugElement.query(By.css('router-outlet'));
    expect(outlet).toBeTruthy();
  });
});
