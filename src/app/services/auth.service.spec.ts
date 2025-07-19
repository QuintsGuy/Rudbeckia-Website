import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import { SupabaseService } from './supabase.service';
import { BehaviorSubject, of, take } from 'rxjs';
import { Session, User } from '@supabase/supabase-js';

describe('AuthService', () => {
  let service: AuthService;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockSupabaseService: jasmine.SpyObj<SupabaseService>;
  let mockSupabaseClient: any;

  const mockUser: User = {
    id: '123',
    email: 'test@example.com',
    app_metadata: {},
    user_metadata: { isAdmin: true },
    aud: '',
    created_at: '',
  };

  const mockSession: Session = {
    access_token: 'token',
    token_type: 'bearer',
    expires_in: 3600,
    refresh_token: 'refresh',
    user: mockUser,
  };

  beforeEach(() => {
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockSupabaseService = jasmine.createSpyObj('SupabaseService', ['getClient', 'getUser', 'signOut']);

    // Create auth spy object with required methods
    const authSpy = jasmine.createSpyObj('auth', [
      'getSession',
      'signInWithPassword',
      'updateUser',
      'onAuthStateChange'
    ]);

    authSpy.getSession.and.resolveTo({ data: { session: mockSession } });
    authSpy.signInWithPassword.and.resolveTo({ data: { user: mockUser }, error: null });
    authSpy.updateUser.and.resolveTo({});
    authSpy.onAuthStateChange.and.callFake(() => {});

    // Create mock SupabaseClient with .auth and .from
    mockSupabaseClient = {
      auth: authSpy,
      from: jasmine.createSpy().and.returnValue({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: { passcode: '123' }, error: null })
          })
        })
      })
    };

    mockSupabaseService.getClient.and.returnValue(mockSupabaseClient);

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: Router, useValue: mockRouter },
        { provide: SupabaseService, useValue: mockSupabaseService },
      ],
    });

    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('isAuthenticated', () => {
    it('should emit true if user exists', (done) => {
      (service as any).userSubject.next(mockUser);
      service.isAuthenticated().pipe(take(1)).subscribe(val => {
        expect(val).toBeTrue();
        done();
      });
    });

    it('should emit false if user is null', (done) => {
      (service as any).userSubject.next(null);
      service.isAuthenticated().pipe(take(1)).subscribe(val => {
        expect(val).toBeFalse();
        done();
      });
    });
  });

  describe('isAdmin', () => {
    it('should emit true if user has isAdmin metadata', (done) => {
      (service as any).userSubject.next(mockUser);
      service.isAdmin().pipe(take(1)).subscribe(val => {
        expect(val).toBeTrue();
        done();
      });
    });

    it('should emit false if isAdmin is not set', (done) => {
      const userWithoutAdmin = { ...mockUser, user_metadata: {} };
      (service as any).userSubject.next(userWithoutAdmin);
      service.isAdmin().pipe(take(1)).subscribe(val => {
        expect(val).toBeFalse();
        done();
      });
    });
  });

  describe('isLoggedIn', () => {
    it('should return true if session has user', () => {
      (service as any).session = mockSession;
      expect(service.isLoggedIn()).toBeTrue();
    });

    it('should return false if session is null', () => {
      (service as any).session = null;
      expect(service.isLoggedIn()).toBeFalse();
    });
  });

  describe('login', () => {
    it('should succeed and navigate if user is admin', async () => {
      mockSupabaseClient.auth.getSession.and.resolveTo({ data: { session: mockSession } });

      const result = await service.login('test@example.com', 'password');
      expect(result).toBeNull();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/private/dashboard']);
    });

    it('should return warning after 3 failed login attempts', async () => {
      mockSupabaseClient.auth.signInWithPassword.and.resolveTo({ data: {}, error: { message: 'Invalid' } });

      await service.login('fail@example.com', 'wrong');
      await service.login('fail@example.com', 'wrong');
      const result = await service.login('fail@example.com', 'wrong');

      expect(result).toContain('You have 2 attempts remaining.');
    });

    it('should return lockout message after 5 attempts', async () => {
      mockSupabaseClient.auth.signInWithPassword.and.resolveTo({ data: {}, error: { message: 'Invalid' } });

      for (let i = 0; i < 5; i++) {
        await service.login('blocked@example.com', 'wrong');
      }
      const result = await service.login('blocked@example.com', 'wrong');
      expect(result).toBe('Too many failed attempts. Please try again later.');
    });

    it('should set isAdmin true if missing from metadata', async () => {
      const userWithoutAdmin = { ...mockUser, user_metadata: {} };
      mockSupabaseClient.auth.signInWithPassword.and.resolveTo({ data: { user: userWithoutAdmin }, error: null });
      mockSupabaseClient.auth.getSession.and.resolveTo({ data: { session: mockSession } });

      await service.login('test@example.com', 'password');
      expect(mockSupabaseClient.auth.updateUser).toHaveBeenCalledWith({ data: { isAdmin: true } });
    });

    it('should return unexpected error if exception thrown', async () => {
      mockSupabaseClient.auth.signInWithPassword.and.callFake(() => {
        throw new Error('Oops');
      });

      const result = await service.login('err@example.com', 'fail');
      expect(result).toBe('Unexpected error during login.');
    });
  });

  describe('logout', () => {
    it('should sign out and navigate to login', () => {
      service.logout();
      expect(mockSupabaseService.signOut).toHaveBeenCalled();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/auth/login']);
    });
  });

  describe('verifyPasscode', () => {
    it('should navigate and return true if passcode exists', async () => {
      const result = await service.verifyPasscode('123');
      expect(result).toBeTrue();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/view/proposal'], {
        state: { passcode: { passcode: '123' } },
      });
    });

    it('should return false if passcode not found', async () => {
      mockSupabaseClient.from.and.returnValue({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: null, error: { message: 'not found' } }),
          }),
        }),
      });

      const result = await service.verifyPasscode('bad');
      expect(result).toBeFalse();
    });
  });

  describe('getUser', () => {
    it('should call supabaseService.getUser()', async () => {
      mockSupabaseService.getUser.and.resolveTo(mockUser);
      const result = await service.getUser();
      expect(result).toEqual(mockUser);
    });
  });

  describe('getSession', () => {
    it('should return current session', () => {
      (service as any).session = mockSession;
      expect(service.getSession()).toEqual(mockSession);
    });
  });
});
