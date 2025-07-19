import { Injectable } from '@angular/core';
import { CanActivate, CanActivateChild, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { environment } from '../../environments/environment.prod';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdminAuthGuard implements CanActivate, CanActivateChild {
  constructor(
    private authService: AuthService, 
    private router: Router
  ) {}

  async canActivate(): Promise<boolean> {
    return this.checkAccess();
  }

  async canActivateChild(): Promise<boolean> {
    return this.checkAccess();
  }

  private async checkAccess(): Promise<boolean> {    
    if (environment.bypassAuth) {
      console.warn('⚠️ Auth guard bypassed for development');
      return true;
    }

    await firstValueFrom(this.authService.sessionReady$);

    const [isLoggedIn, isAdmin] = await Promise.all([
      firstValueFrom(this.authService.isAuthenticated()),
      this.authService.isAdmin()
    ]);

    if (isLoggedIn && isAdmin) {
      return true;
    }

    console.warn('🚫 Access denied by guard, redirecting to /auth/login');
    this.router.navigate(['/auth/login']);
    return false;
  }
}





