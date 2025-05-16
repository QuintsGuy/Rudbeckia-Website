import { CommonModule } from '@angular/common';
import { AfterViewInit, Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { initFlowbite } from 'flowbite';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent implements AfterViewInit {
  unreadCount = 0;
  
  constructor(private authService: AuthService) {}

  ngAfterViewInit(): void {
    initFlowbite();
  }
  
  Logout() {
    this.authService.logout();
  }
}
