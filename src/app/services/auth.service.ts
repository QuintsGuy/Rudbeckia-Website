import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Session, SupabaseClient, User } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';
import { BehaviorSubject, map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private supabase: SupabaseClient;
  private loginAttempts: Record<string, number> = {};
  private session: Session | null = null;

  private sessionReady = new BehaviorSubject<boolean>(false);
  sessionReady$ = this.sessionReady.asObservable();

  private userSubject = new BehaviorSubject<User | null>(null);
  user$ = this.userSubject.asObservable();

  constructor(
    private router: Router, 
    private supabaseService: SupabaseService) 
  {
    this.supabase = this.supabaseService.getClient();

    this.supabase.auth.getSession().then(({ data: { session } }) => {
      this.session = session;
      this.userSubject.next(session?.user || null);
      this.sessionReady.next(true);
    });

    this.supabase.auth.onAuthStateChange((_event, session) => {
      this.session = session;
      this.userSubject.next(session?.user || null);
    });
  }

  async init(): Promise<void> {
    try {
      const { data } = await this.supabase.auth.getSession();
      this.session = data.session;
      this.userSubject.next(this.session?.user || null);
      this.sessionReady.next(true);
    } catch (e) {
      console.error('AuthService init failed:', e);
      this.sessionReady.next(true);
    }
  }

  isAuthenticated(): Observable<boolean> {
    return this.user$.pipe(map(user => !!user));
  }

  isAdmin(): Observable<boolean> {
    return this.user$.pipe(
      map(user => user?.user_metadata?.['isAdmin'] === true)
    );
  }

  isLoggedIn(): boolean {
    return !!this.session?.user;
  }

  async login(email: string, password: string): Promise<string | null> {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });

      if (error) {
        console.warn('⚠️ Supabase login error:', error.message);
        return this.handleFailedAttempt(email);
      }

      const user = data.user;
      this.resetAttempts(email);

      if (!user?.user_metadata?.['isAdmin']) {
        await this.supabase.auth.updateUser({ data: { isAdmin: true } });
      }

      const { data: refreshedSession } = await this.supabase.auth.getSession();
      this.session = refreshedSession?.session || null;
      this.userSubject.next(this.session?.user || null);
      this.router.navigate(['/private/dashboard']);

      return null;
    } catch (err) {
      console.error('🔥 Unexpected login error:', err);
      return 'Unexpected error during login.';
    }
  }

  logout(): void {
    this.supabaseService.signOut();
    this.session = null;
    this.userSubject.next(null);
    this.router.navigate(['/auth/login']);
  }

  async getUser(): Promise<User | null> {
    return this.supabaseService.getUser();
  }

  getSession(): Session | null {
    return this.session;
  }

  async verifyPasscode(passcode: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('passcodes')
        .select('passcode')
        .eq('passcode', passcode)
        .single();

      if (error || !data) {
        return false;
      }

      this.router.navigate(['/view/proposal'], { state: { passcode: data } });
      return true;
    } catch (err) {
      return false;
    }
  }

  private handleFailedAttempt(email: string): string {
    const attempts = (this.loginAttempts[email] || 0) + 1;
    this.loginAttempts[email] = attempts;

    if (attempts >= 5) return 'Too many failed attempts. Please try again later.';
    if (attempts >= 3) return `Incorrect username or password. You have ${5 - attempts} attempts remaining.`;

    return 'Incorrect username or password. Please try again.';
  }

  private resetAttempts(email: string): void {
    this.loginAttempts[email] = 0;
  }
}
