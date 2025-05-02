// admin-inbox.component.ts
import { Component, OnInit } from '@angular/core';
import { SupabaseService } from '../../../services/supabase.service';
import { Router, RouterLink} from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-inbox',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './inbox.component.html',
  styleUrls: ['./inbox.component.css']
})
export class InboxComponent implements OnInit {
  inquiries: any[] = [];
  loading: boolean = true;
  user: any;
  selectedInquiry: any = null;
  actionLoading: boolean = false;

  filterStatus: string = 'pending';
  searchTerm: string = '';
  currentPage: number = 1;
  pageSize: number = 10;
  totalRecords: number = 0;

  selectedIds: Set<number> = new Set();
  showDeleteConfirmModal: boolean = false;
  
  searchForm: FormGroup = new FormGroup({
    searchTerm: new FormControl('')
  });

  constructor(private supabase: SupabaseService, private router: Router) {}

  async ngOnInit() {
    const session = await this.supabase.getClient().auth.getSession();
    this.user = session.data.session?.user;

    if (!this.user || this.user.user_metadata?.isAdmin !== true) {
      this.router.navigate(['/']);
      return;
    }

    this.searchForm.get('searchTerm')?.valueChanges.subscribe(value => {
      this.searchTerm = value;
      this.currentPage = 1;
      this.fetchInquiries();
    });

    await this.fetchInquiries();
  }

  async fetchInquiries() {
    this.loading = true;

    const from = (this.currentPage - 1) * this.pageSize;
    const to = from + this.pageSize - 1;

    let query = this.supabase.getClient()
      .from('inquiries')
      .select(`
        *,
        client:clients (
          first_name,
          last_name,
          email,
          phone
        ),
        coordinator:coordinators (
          name,
          email,
          phone
        )
      `, { count: 'exact' })
      .range(from, to);

    if (this.filterStatus !== 'All') {
      query = query.eq('status', this.filterStatus);
    }

    if (this.searchTerm.trim()) {
      query = query.or(
        `event_type::text.ilike.%${this.searchTerm}%,` +
        `venue.ilike.%${this.searchTerm}%,` +
        `status::text.ilike.%${this.searchTerm}%`
      );
    }

    const { data, count, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      console.error('Failed to load inquiries:', error.message);
    } else {
      this.inquiries = data || [];
      this.totalRecords = count || 0;
    }
    this.loading = false;
  }

  onFilterChange(status: string) {
    this.filterStatus = status;
    this.currentPage = 1;
    this.fetchInquiries();
  }

  nextPage() {
    if ((this.currentPage * this.pageSize) < this.totalRecords) {
      this.currentPage++;
      this.fetchInquiries();
    }
  }
  
  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.fetchInquiries();
    }
  }

  toggleSelection(id: number, event: Event) {
    const checkbox = event.target as HTMLInputElement;
    if (checkbox?.checked) {
      this.selectedIds.add(id);
    } else {
      this.selectedIds.delete(id);
    }
  }

  isAnySelected(): boolean {
    return this.selectedIds.size > 0;
  }

  async bulkMarkUnread() {
    if (!this.isAnySelected()) return;

    const { error } = await this.supabase.getClient()
      .from('inquiries')
      .update({ is_read: false })
      .in('inquiry_id', Array.from(this.selectedIds));

    if (error) {
      console.error('Failed to mark as unread:', error.message);
    } else {
      this.selectedIds.clear();
      await this.fetchInquiries();
    }
  }

  async bulkMarkRead() {
    if (!this.isAnySelected()) return;

    const { error } = await this.supabase.getClient()
      .from('inquiries')
      .update({ is_read: true })
      .in('inquiry_id', Array.from(this.selectedIds));

    if (error) {
      console.error('Failed to mark as read:', error.message);
    } else {
      this.selectedIds.clear();
      await this.fetchInquiries();
    }
  }

  showDeleteModal() {
    if (this.isAnySelected()) {
      this.showDeleteConfirmModal = true;
    }
  }

  async bulkDelete() {
    if (!this.isAnySelected()) return;

    const { error } = await this.supabase.getClient()
      .from('inquiries')
      .delete()
      .in('inquiry_id', Array.from(this.selectedIds));

    if (error) {
      console.error('Failed to delete inquiries:', error.message);
    } else {
      this.selectedIds.clear();
      await this.fetchInquiries();
    }

    this.showDeleteConfirmModal = false;
  }

  cancelDelete() {
    this.showDeleteConfirmModal = false;
  }

  async openInquiryModal(inq: any) {
    this.selectedInquiry = inq;

    if (!inq.is_read) {
      const { error } = await this.supabase.getClient()
        .from('inquiries')
        .update({ is_read: true })
        .eq('inquiry_id', inq.inquiry_id);
  
      if (error) {
        console.error('Failed to mark inquiry as read:', error.message);
      } else {
        inq.is_read = true;
      }
    }

    const modal = document.getElementById('readUserModal');
    const modalWrapper = modal?.querySelector('.modal-wrapper');
    
    if (modal && modalWrapper) {
      modal.classList.remove('hidden');
      setTimeout(() => {
        modalWrapper.classList.remove('opacity-0', 'scale-95');
        modalWrapper.classList.add('opacity-100', 'scale-100');
      }, 10);
    }
  }

  closeInquiryModal() {
    const modal = document.getElementById('readUserModal');
    const modalWrapper = modal?.querySelector('.modal-wrapper');
    if (modal && modalWrapper) {
      modalWrapper.classList.add('opacity-0', 'scale-95');
      modalWrapper.classList.remove('opacity-100', 'scale-100');
      setTimeout(() => {
        modal.classList.add('hidden');
        this.selectedInquiry = null;
      }, 200);
    }
  }

  async acceptInquiry() {
    if (!confirm('Are you sure you want to ACCEPT this inquiry and create an event?')) return;
    this.actionLoading = true;

    const inq = this.selectedInquiry;
    const { error: updateError } = await this.supabase.getClient()
      .from('inquiries')
      .update({ status: 'accepted' })
      .eq('inquiry_id', inq.inquiry_id);

    const { error: insertError } = await this.supabase.getClient()
      .from('events')
      .insert([{
        client_id: inq.client_id,
        coordinator_id: inq.coordinator_id,
        event_date: inq.event_date,
        event_type: inq.event_type,
        venue: inq.venue,
        budget: inq.budget,
        pinterest_url: inq.pinterest_url,
        notes: inq.message,
        status: 'approved',
      }]);

    if (updateError || insertError) {
      console.error('Error processing inquiry:', updateError || insertError);
    } else {
      this.closeInquiryModal();
      await this.fetchInquiries();
    }

    this.actionLoading = false;
    alert('Accepted! A new event has been created from the inquiry data. Please view on the events tab.')
  }

  async declineInquiry() {
    if (!confirm('Are you sure you want to DECLINE this Inquiry?')) return;

    const inq = this.selectedInquiry;
    const { error } = await this.supabase.getClient()
      .from('inquiries')
      .update({ status: 'declined' })
      .eq('inquiry_id', inq.inquiry_id);

    if (error) {
      console.error('Error declining inquiry:', error.message);
    } else {
      this.closeInquiryModal();
      await this.fetchInquiries();
    }
  }
}
