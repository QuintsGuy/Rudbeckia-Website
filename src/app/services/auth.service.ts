import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseClient, createClient, Session } from '@supabase/supabase-js';
import { environment } from '../../environments/environment.dev';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private supabase: SupabaseClient;
  private loginAttempts: Record<string, number> = {};
  private session: Session | null = null;

  constructor(private router: Router) {
    this.supabase = createClient(environment.SUPABASE_URL, environment.SUPABASE_KEY);
    this.supabase.auth.getSession().then(({ data }) => {
      this.session = data.session;
      console.log('✅ Restored session:', this.session);
    });

    this.supabase.auth.onAuthStateChange((_event, session) => {
      this.session = session;
    });
  }

  async login(email: string, password: string): Promise<string | null> {
    const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return this.handleFailedAttempt(email);
    }

    const user = data.user;
    this.resetAttempts(email);

    // Set isAdmin to true in user metadata if not already set
    if (!user?.user_metadata['isAdmin']) {
      await this.supabase.auth.updateUser({ data: { isAdmin: true } });
    }

    // Optional: manually refresh the session (e.g., get latest JWT)
    const { data: refreshedSession } = await this.supabase.auth.getSession();
    const jwt = refreshedSession.session?.access_token;
    this.session = refreshedSession?.session || null;

    console.log('JWT: ', jwt);

    this.router.navigate(['/private/dashboard']);
    return null;
  }

  async verifyPasscode(passcode: string) {
    const { data, error } = await this.supabase
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
    this.supabase.auth.signOut();
    this.session = null;
    this.router.navigate(['auth/login']);
  }

  getSession(): Session | null {
    return this.session;
  }

  async getUser() {
    const { data } = await this.supabase.auth.getUser();
    return data.user;
  }

  isLoggedIn(): boolean {
    return !!this.session;
  }

  async isAdmin(): Promise<boolean> {
    const user = await this.getUser();
    return !!user?.user_metadata['isAdmin'];
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
