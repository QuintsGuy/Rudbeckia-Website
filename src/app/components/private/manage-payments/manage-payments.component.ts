import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, OnInit } from '@angular/core';
import { initFlowbite } from 'flowbite';
import { SupabaseService } from '../../../services/supabase.service';
import { Router } from '@angular/router';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-manage-payments',
  imports: [CommonModule],
  templateUrl: './manage-payments.component.html',
  styleUrl: './manage-payments.component.css'
})
export class ManagePaymentsComponent implements AfterViewInit, OnInit {
  ngAfterViewInit(): void {
    initFlowbite();
  }

  events: any[] = [];
  targetEvent: any = null;
  targetInstallment: any = null;
  loading: boolean = true;
  actionLoading: boolean = false;

  user: any;
  currentPage: number = 1;
  pageSize: number = 10;
  totalRecords: number = 0;
  displayedColumns: string[] = ['action', 'event', 'venue', 'date', 'status'];

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

    await this.fetchEvents();
  }

  async fetchEvents() {
    this.loading = true;
    
    const from = (this.currentPage - 1) * this.pageSize;
    const to = from + this.pageSize - 1;

    const { data: eventsData, count, error: fetchError } = await this.supabase.getClient()
      .from('events')
      .select(`*, invoice:invoices (invoice_id, installment:installments (*))`, {count: 'exact'})
      .order('created_at', {ascending: false})
      .range(from, to);
    
    console.log(eventsData);
    
    if (fetchError) {
      console.error('Failed to load events: ', fetchError.message);
      this.toast.showToast('Failed to load events', 'error');
    } else {
      this.events = eventsData?.map(event => ({
        ...event,
        isExpanded: false,
      })) || [];
      this.totalRecords = count || 0;
    }
    this.loading = false;
  }
}
