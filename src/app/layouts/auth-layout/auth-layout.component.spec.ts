import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { AuthLayoutComponent } from './auth-layout.component';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';

describe('AuthLayoutComponent', () => {
  let component: AuthLayoutComponent;
  let fixture: ComponentFixture<AuthLayoutComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [AuthLayoutComponent], // ✅ standalone component
      providers: [provideRouter([])], // ✅ router providers for <router-outlet> & ActivatedRoute
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AuthLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the AuthLayoutComponent', () => {
    expect(component).toBeTruthy();
  });

  it('should render the <app-navbar> component', () => {
    const navbar = fixture.debugElement.query(By.css('app-navbar'));
    expect(navbar).toBeTruthy();
  });

  it('should render the <router-outlet>', () => {
    const outlet = fixture.debugElement.query(By.css('router-outlet'));
    expect(outlet).toBeTruthy();
  });
});
