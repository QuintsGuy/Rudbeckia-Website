import { TestBed } from '@angular/core/testing';
import { SupabaseService } from './supabase.service';
import { SupabaseClient, Session, User } from '@supabase/supabase-js';

describe('SupabaseService', () => {
  let service: SupabaseService;
  let mockSupabaseClient: any;
  let authSpy: jasmine.SpyObj<any>;

  const mockUser: User = {
    id: 'user-123',
    email: 'user@example.com',
    user_metadata: { isAdmin: true },
    app_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
  };

  const mockSession: Session = {
    access_token: 'access-token',
    token_type: 'bearer',
    expires_in: 3600,
    refresh_token: 'refresh-token',
    user: mockUser,
  };

  beforeEach(() => {
    // Create spies for auth methods
    authSpy = jasmine.createSpyObj('auth', ['getUser', 'getSession', 'signOut']);

    // Attach authSpy to a mock SupabaseClient
    mockSupabaseClient = { auth: authSpy };

    // Stub the global supabase instance
    (window as any).supabase = mockSupabaseClient;

    TestBed.configureTestingModule({
      providers: [SupabaseService],
    });

    service = TestBed.inject(SupabaseService);
  });

  afterEach(() => {
    delete (window as any).supabase;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getClient()', () => {
    it('should return the Supabase client instance', () => {
      const client = service.getClient();
      expect(client).toBe(mockSupabaseClient);
    });
  });

  describe('getUser()', () => {
    it('should return the user if available', async () => {
      authSpy.getUser.and.resolveTo({ data: { user: mockUser }, error: null });

      const result = await service.getUser();
      expect(result).toEqual(mockUser);
    });

    it('should return null and log error if getUser fails', async () => {
      const consoleSpy = spyOn(console, 'error');
      authSpy.getUser.and.resolveTo({
        data: { user: null },
        error: { message: 'User error' }
      });

      const result = await service.getUser();
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching user:', 'User error');
    });
  });

  describe('getSession()', () => {
    it('should return session if available', async () => {
      authSpy.getSession.and.resolveTo({ data: { session: mockSession }, error: null });

      const result = await service.getSession();
      expect(result).toEqual(mockSession);
    });

    it('should return null and log error if getSession fails', async () => {
      const consoleSpy = spyOn(console, 'error');
      authSpy.getSession.and.resolveTo({
        data: { session: null },
        error: { message: 'Session error' }
      });

      const result = await service.getSession();
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching session:', 'Session error');
    });
  });

  describe('signOut()', () => {
    it('should call signOut without error', async () => {
      authSpy.signOut.and.resolveTo({ error: null });

      await service.signOut();
      expect(authSpy.signOut).toHaveBeenCalled();
    });

    it('should log if signOut returns an error', async () => {
      const consoleSpy = spyOn(console, 'error');
      authSpy.signOut.and.resolveTo({ error: { message: 'Sign out failed' } });

      await service.signOut();
      expect(consoleSpy).toHaveBeenCalledWith('Error signing out:', 'Sign out failed');
    });

    it('should catch and log unexpected error', async () => {
      const consoleSpy = spyOn(console, 'error');
      authSpy.signOut.and.callFake(() => {
        throw new Error('Unexpected failure');
      });

      await service.signOut();
      expect(consoleSpy).toHaveBeenCalledWith('Unexpected signOut error:', jasmine.any(Error));
    });
  });

  describe('isAdmin()', () => {
    it('should return true if user is admin', async () => {
      spyOn(service, 'getUser').and.resolveTo(mockUser);
      const result = await service.isAdmin();
      expect(result).toBeTrue();
    });

    it('should return false if user is not admin', async () => {
      spyOn(service, 'getUser').and.resolveTo({ ...mockUser, user_metadata: {} });
      const result = await service.isAdmin();
      expect(result).toBeFalse();
    });

    it('should return false if user is null', async () => {
      spyOn(service, 'getUser').and.resolveTo(null);
      const result = await service.isAdmin();
      expect(result).toBeFalse();
    });
  });
});
