import { Injectable } from '@angular/core';
import { CanActivate, CanActivateChild, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { environment } from '../../environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class AdminAuthGuard implements CanActivate, CanActivateChild {
  constructor(private authService: AuthService, private router: Router) {}

  async canActivate(): Promise<boolean> {
    return this.checkAdminAccess();
  }

  async canActivateChild(): Promise<boolean> {
    return this.checkAdminAccess();
  }

  private async checkAdminAccess(): Promise<boolean> {
    if (environment.bypassAuth) {
      console.warn('⚠️ Auth guard bypassed for development');
      return true;
    }
    
    const isLoggedIn = this.authService.isLoggedIn();
    const isAdmin = await this.authService.isAdmin();

    if (isLoggedIn && isAdmin) {
      return true;
    }

    this.router.navigate(['/login']);
    return false;
  }
}





