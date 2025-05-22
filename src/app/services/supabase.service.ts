// src/app/services/supabase.service.ts
import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '../../environments/environment.prod';

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
        environment['SUPABASE_URL'] as string,
        environment['SUPABASE_KEY'] as string,
        { auth: { persistSession: true } }
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

  async signOut() {
    await this.supabase.auth.signOut();
  }

  async isAdmin(): Promise<boolean> {
    const user = await this.getUser();
    if (!user) return false;

    // Example: assuming isAdmin is stored in user_metadata
    return user.user_metadata['isAdmin'] === true;
  }
}
