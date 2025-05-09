import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
  hideLoginButton = false;
  private hiddenRoutes = ['/auth/passcode', '/terms-and-conditions', '/view/proposal', '/auth/login', '/contact', '/view/payments', '/view/payment-success', '/view/payment-cancel'];
  
  constructor(private router: Router) {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.hideLoginButton = this.hiddenRoutes.includes(event.urlAfterRedirects);
      });
  }

  collapseMenu() {
    const toggleButton = document.querySelector('[data-collapse-toggle="mobile-menu-2"]') as HTMLElement;
    const menu = document.getElementById('mobile-menu-2');
  
    if (toggleButton && menu && !menu.classList.contains('hidden')) {
      setTimeout(() => toggleButton.click(), 10);
    }
  }
}
