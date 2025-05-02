import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
  collapseMenu() {
    const toggleButton = document.querySelector('[data-collapse-toggle="mobile-menu-2"]') as HTMLElement;
    const menu = document.getElementById('mobile-menu-2');
  
    if (toggleButton && menu && !menu.classList.contains('hidden')) {
      setTimeout(() => toggleButton.click(), 10);
    }
  }
}
