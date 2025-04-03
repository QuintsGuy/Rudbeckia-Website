import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service'; // adjust the path if needed

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  async Logout(): Promise<void> {
    await this.authService.logout();
    this.router.navigate(['/login']);
  }
}
