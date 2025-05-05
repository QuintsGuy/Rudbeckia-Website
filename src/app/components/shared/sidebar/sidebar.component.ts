import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
  unreadCount = 0;
  
  constructor(private authService: AuthService) {}
  
  Logout() {
    this.authService.logout();
  }

  collapseMenu() {
    const toggleButton = document.querySelector('[data-collapse-toggle="mobile-menu-2"]') as HTMLElement;
    const menu = document.getElementById('mobile-menu-2');
  
    if (toggleButton && menu && !menu.classList.contains('hidden')) {
      setTimeout(() => toggleButton.click(), 10);
    }
  }
}