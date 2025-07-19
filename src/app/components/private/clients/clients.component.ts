import { Component } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { SupabaseService } from '../../../services/supabase.service';
import { Router } from '@angular/router';
import { ToastService } from '../../../services/toast.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './clients.component.html',
  styleUrl: './clients.component.css'
})
export class ClientsComponent {
  clients: any[] = [];
  targetClient: any = null;
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

    await this.fetchClients();
  }

  async fetchClients() {
    this.loading = true;
    
    const from = (this.currentPage - 1) * this.pageSize;
    const to = from + this.pageSize - 1;

    const { data: clientsData, count, error: fetchError } = await this.supabase.getClient()
      .from('clients')
      .select(`*, event:events (*)`)
      .order('created_at', {ascending: false})
      .range(from, to);
    
    if (fetchError) {
      console.error('Failed to load clients: ', fetchError.message);
      this.toast.showToast('Failed to load clients', 'error');
    } else {
      this.clients = clientsData?.map(client => ({
        ...client,
        isExpanded: false,
      })) || [];
      this.totalRecords = count || 0;
    }
    this.loading = false;
  }

  toggleExpand(client: any) {
    client.expanded = !client.expanded;

    if (client.expanded && client.events?.length) {
      client.events = [...client.event].sort((a, b) => {
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime(); // ascending
      });
    }
  }
}
