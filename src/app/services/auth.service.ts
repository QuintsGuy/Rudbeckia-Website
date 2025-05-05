import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Session, SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private supabase: SupabaseClient;
  private loginAttempts: Record<string, number> = {};
  private session: Session | null = null;

  constructor(private router: Router, private supabaseService: SupabaseService) {
    this.supabase = this.supabaseService.getClient();
  }

  async init(): Promise<void> {
    try {
      const { data } = await this.supabase.auth.getSession();
      this.session = data.session;
      console.log('✅ Restored session:', this.session);

      this.supabase.auth.onAuthStateChange((_event, session) => {
        this.session = session;
      });
    } catch (e) {
      console.error('AuthService init failed:', e);
    }
  }

  async login(email: string, password: string): Promise<string | null> {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return this.handleFailedAttempt(email);
    }

    const user = data.user;
    this.resetAttempts(email);

    if (!user?.user_metadata['isAdmin']) {
      await supabase.auth.updateUser({ data: { isAdmin: true } });
    }

    const { data: refreshedSession } = await supabase.auth.getSession();
    this.session = refreshedSession?.session || null;
    this.router.navigate(['/private/dashboard']);
    return null;
  }

  async verifyPasscode(passcode: string) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('passcodes')
      .select('passcode')
      .eq('passcode', passcode)
      .single();

    if (error || !data) {
      console.log('Error verifying passcode: ', error);
      return;
    }

    this.router.navigate(['/view/proposal'], { state: { passcode: data } });
  }

  logout(): void {
    this.supabaseService.signOut();
    this.session = null;
    this.router.navigate(['/auth/login']);
  }

  getSession(): Session | null {
    return this.session;
  }

  async getUser() {
    return this.supabaseService.getUser();
  }

  isLoggedIn(): boolean {
    return !!this.session;
  }

  async isAdmin(): Promise<boolean> {
    return this.supabaseService.isAdmin();
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
