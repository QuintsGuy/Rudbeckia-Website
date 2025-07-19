// src/app/services/supabase.service.ts
import { Injectable } from '@angular/core';
import { createClient, Session, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

declare global {
  interface Window { supabase?: SupabaseClient }
}

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    if (!window.supabase) {
      window.supabase = createClient(
        environment['supabaseUrl'] as string,
        environment['supabaseKey'] as string,
        { 
          auth: { 
            persistSession: true,
            autoRefreshToken: true
          } 
        }
      );
      console.log('SupabaseService Initialized');
    } else {
      console.log('Using cached Supabase instance');
    }

    this.supabase = window.supabase!;
  }

  getClient(): SupabaseClient {
    return this.supabase;
  }

  async getUser(): Promise<User | null> {
    const { data, error } = await this.supabase.auth.getUser();
    if (error) {
      console.error('Error fetching user:', error.message);
      return null;
    }
    return data.user;
  }

  async getSession(): Promise<Session | null> {
    const { data, error } = await this.supabase.auth.getSession();
    if (error) {
      console.error('Error fetching session:', error.message);
      return null;
    }
    return data.session;
  }

  async signOut() {
    try {
      const { error } = await this.supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error.message);
      }
    } catch (err) {
      console.error('Unexpected signOut error:', err);
    }
  }

  async isAdmin(): Promise<boolean> {
    const user = await this.getUser();
    if (!user) return false;

    // Example: assuming isAdmin is stored in user_metadata
    return user.user_metadata['isAdmin'] === true;
  }
}
