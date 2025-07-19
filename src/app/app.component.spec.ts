import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { AuthService } from './services/auth.service';
import { DebugElement } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { By } from '@angular/platform-browser';
import { ToastComponent } from './components/shared/toast/toast.component';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  
  beforeEach(waitForAsync(() => {
    mockAuthService = jasmine.createSpyObj<AuthService>('AuthService', ['init']);

    TestBed.configureTestingModule({
      imports: [AppComponent], // ✅ because AppComponent is standalone
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have the 'Rudbeckia-Website' title`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('Rudbeckia-Website');
  });

  it('should call authService.init() on ngOnInit', async () => {
    mockAuthService.init.and.resolveTo(); // simulate async function
    await component.ngOnInit();
    expect(mockAuthService.init).toHaveBeenCalled();
  });

  it('should render <app-toast> in the template', () => {
    const toastEl: DebugElement = fixture.debugElement.query(By.css('app-toast'));
    expect(toastEl).toBeTruthy();
  });

  it('should render <router-outlet> in the template', () => {
    const outletEl: DebugElement = fixture.debugElement.query(By.directive(RouterOutlet));
    expect(outletEl).toBeTruthy();
  });
});
