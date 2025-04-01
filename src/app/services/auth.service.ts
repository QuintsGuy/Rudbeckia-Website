// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private supabase: SupabaseService) {}

  async getCurrentUser() {
    return await this.supabase.getUser();
  }

  async isLoggedIn(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return !!user;
  }

  async isAdmin(): Promise<boolean> {
    return await this.supabase.isAdmin();
  }
}
