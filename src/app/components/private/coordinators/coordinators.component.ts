import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { SupabaseService } from '../../../services/supabase.service';
import { Router } from '@angular/router';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-coordinators',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './coordinators.component.html',
  styleUrl: './coordinators.component.css'
})
export class CoordinatorsComponent {
  coordinators: any[] = [];
  targetCoordinator: any = null;
  events: any[] = [];
  editableEvents: any[] = [];
  editingEvents: boolean = false;
  loading: boolean = true;
  actionLoading: boolean = false;

  user: any;
  currentPage: number = 1;
  pageSize: number = 10;
  totalRecords: number = 0;

  constructor(
    private supabase: SupabaseService,
    private router: Router,
    private toast: ToastService
  ) {}

  async ngOnInit(): Promise<void> {
    const session = await this.supabase.getClient().auth.getSession();
    this.user = session.data.session?.user;

    if(!this.user) {
      this.router.navigate(['/']);
      return;
    }

    await this.fetchCoordinators();
  }

  async fetchCoordinators() {
    this.loading = true;
    
    const from = (this.currentPage - 1) * this.pageSize;
    const to = from + this.pageSize - 1;

    const { data: coordinatorsData, count, error: fetchError } = await this.supabase.getClient()
      .from('coordinators')
      .select(`*, event:events (*)`)
      .order('created_at', {ascending: false})
      .range(from, to);
    
    console.log(coordinatorsData);
    
    if (fetchError) {
      console.error('Failed to load coordinators: ', fetchError.message);
      this.toast.showToast('Failed to load coordinators', 'error');
    } else {
      this.coordinators = coordinatorsData?.map(coordinator => ({
        ...coordinator,
        isExpanded: false,
      })) || [];
      this.totalRecords = count || 0;
    }
    this.loading = false;
  }

  toggleExpand(coordinator: any) {
    coordinator.expanded = !coordinator.expanded;

    if (coordinator.expanded && coordinator.events?.length) {
      coordinator.events = [...coordinator.event].sort((a, b) => {
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime(); // ascending
      });
    }
  }
}
