import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service'; // adjust the path if needed
import { SupabaseService } from '../../../services/supabase.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent implements OnInit {
  unreadCount: number = 0;

  constructor(
    private authService: AuthService,
    private supabase: SupabaseService,
    private router: Router
  ) {}

  async ngOnInit() {
    await this.fetchUnreadCount();
  }

  async fetchUnreadCount() {
    const { count, error } = await this.supabase.getClient()
      .from('inquiries')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false);

    if (error) {
      console.error('Error fetching unread count:', error.message);
    } else {
      this.unreadCount = count ?? 0;
    }
  }

  async Logout(): Promise<void> {
    await this.authService.logout();
    this.router.navigate(['/login']);
  }
}
