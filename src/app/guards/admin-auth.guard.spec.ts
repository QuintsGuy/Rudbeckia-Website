import { TestBed } from '@angular/core/testing';
import { AdminAuthGuard } from './admin-auth.guard';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import * as prodEnvironment from '../../environments/environment.prod';

describe('AdminAuthGuard', () => {
  let guard: AdminAuthGuard;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(() => {
    mockAuthService = jasmine.createSpyObj('AuthService', ['isAuthenticated', 'isAdmin'], {
      sessionReady$: of(true),
    });
    mockAuthService.isAuthenticated.and.returnValue(of(true));
    mockAuthService.isAdmin.and.returnValue(of(true)); // ⬅ FIXED

    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        AdminAuthGuard,
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
      ],
    });

    guard = TestBed.inject(AdminAuthGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  it('should allow access when user is authenticated and is admin', async () => {
    mockAuthService.isAuthenticated.and.returnValue(of(true));
    mockAuthService.isAdmin.and.returnValue(of(true));

    const result = await guard.canActivate();
    expect(result).toBeTrue();
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('should deny access and redirect when user is not authenticated', async () => {
    mockAuthService.isAuthenticated.and.returnValue(of(false));
    mockAuthService.isAdmin.and.returnValue(of(false));

    const result = await guard.canActivate();
    expect(result).toBeFalse();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/auth/login']);
  });

  it('should deny access and redirect when user is not an admin', async () => {
    mockAuthService.isAuthenticated.and.returnValue(of(true));
    mockAuthService.isAdmin.and.returnValue(of(false));

    const result = await guard.canActivate();
    expect(result).toBeFalse();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/auth/login']);
  });

  it('should allow access if auth is bypassed (bypassAuth = true)', async () => {
    const originalBypassAuth = prodEnvironment.environment.bypassAuth;
    prodEnvironment.environment.bypassAuth = true;

    const result = await guard.canActivate();
    expect(result).toBeTrue();

    prodEnvironment.environment.bypassAuth = originalBypassAuth;
  });

  it('should reuse logic for canActivateChild', async () => {
    mockAuthService.isAuthenticated.and.returnValue(of(true));
    mockAuthService.isAdmin.and.returnValue(of(true));

    const result = await guard.canActivateChild();
    expect(result).toBeTrue();
  });
});
