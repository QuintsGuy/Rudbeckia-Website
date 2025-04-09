// admin-inbox.component.ts
import { Component, OnInit } from '@angular/core';
import { SupabaseService } from '../../../services/supabase.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-inbox',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './inbox.component.html',
  styleUrls: ['./inbox.component.css']
})
export class InboxComponent implements OnInit {
  messages: any[] = [];
  loading: boolean = true;
  user: any;
  selectedMessage: any = null;
  actionLoading: boolean = false;

  filterStatus: string = 'All';
  searchTerm: string = '';
  currentPage: number = 1;
  pageSize: number = 10;
  totalRecords: number = 0;

  selectedIds: Set<number> = new Set();
  
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
      this.fetchMessages();
    });

    await this.fetchMessages();
  }

  async fetchMessages() {
    this.loading = true;

    const from = (this.currentPage - 1) * this.pageSize;
    const to = from + this.pageSize - 1;

    let query = this.supabase.getClient()
      .from('contact_msg')
      .select('*', { count: 'exact' })
      .range(from, to);

    if (this.filterStatus !== 'All') {
      query = query.eq('status', this.filterStatus);
    }

    if (this.searchTerm.trim()) {
      query = query.or(
        `name.ilike.%${this.searchTerm}%,event_type.ilike.%${this.searchTerm}%,venue.ilike.%${this.searchTerm}%,coordinator.ilike.%${this.searchTerm}%`
      )
    }

    const { data, count, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      console.error('Failed to load messages:', error.message);
    } else {
      this.messages = data || [];
      this.totalRecords = count || 0;
    }
    this.loading = false;
  }

  onFilterChange(status: string) {
    this.filterStatus = status;
    this.currentPage = 1;
    this.fetchMessages();
  }

  nextPage() {
    if ((this.currentPage * this.pageSize) < this.totalRecords) {
      this.currentPage++;
      this.fetchMessages();
    }
  }
  
  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.fetchMessages();
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
      .from('contact_msg')
      .update({ is_read: false })
      .in('id', Array.from(this.selectedIds));

    if (error) {
      console.error('Failed to mark as unread:', error.message);
    } else {
      this.selectedIds.clear();
      await this.fetchMessages();
    }
  }

  async bulkMarkRead() {
    if (!this.isAnySelected()) return;

    const { error } = await this.supabase.getClient()
      .from('contact_msg')
      .update({ is_read: true })
      .in('id', Array.from(this.selectedIds));

    if (error) {
      console.error('Failed to mark as read:', error.message);
    } else {
      this.selectedIds.clear();
      await this.fetchMessages();
    }
  }

  async bulkDelete() {
    if (!this.isAnySelected()) return;

    if (!confirm('Are you sure you want to permanently delete the selected messages?')) return;

    const { error } = await this.supabase.getClient()
      .from('contact_msg')
      .delete()
      .in('id', Array.from(this.selectedIds));

    if (error) {
      console.error('Failed to delete messages:', error.message);
    } else {
      this.selectedIds.clear();
      await this.fetchMessages();
    }
  }

  async openMessageModal(msg: any) {
    this.selectedMessage = msg;

    if (!msg.is_read) {
      const { error } = await this.supabase.getClient()
        .from('contact_msg')
        .update({ is_read: true })
        .eq('id', msg.id);
  
      if (error) {
        console.error('Failed to mark message as read:', error.message);
      } else {
        msg.is_read = true; // update local data
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

  closeMessageModal() {
    const modal = document.getElementById('readUserModal');
    const modalWrapper = modal?.querySelector('.modal-wrapper');
    if (modal && modalWrapper) {
      modalWrapper.classList.add('opacity-0', 'scale-95');
      modalWrapper.classList.remove('opacity-100', 'scale-100');
      setTimeout(() => {
        modal.classList.add('hidden');
        this.selectedMessage = null;
      }, 200);
    }
  }

  async acceptMessage() {
    if (!confirm('Are you sure you want to ACCEPT this message and create an event?')) return;
    this.actionLoading = true;

    const msg = this.selectedMessage;
    const { error: updateError } = await this.supabase.getClient()
      .from('contact_msg')
      .update({ status: 'Accepted', decision_by: this.user.id })
      .eq('id', msg.id);

    const { error: insertError } = await this.supabase.getClient()
      .from('events')
      .insert([{
        contact_msg_id: msg.id,
        name: msg.name,
        email: msg.email,
        phone: msg.phone,
        event_date: msg.event_date,
        event_type: msg.event_type,
        venue: msg.venue,
        budget: msg.budget,
        coordinator: msg.coordinator,
        coordinator_email: msg.coordinator_email,
        message: msg.message,
        status: 'Accepted',
        to_do: 'Draft Proposal'
      }]);

    if (updateError || insertError) {
      console.error('Error processing message:', updateError || insertError);
    } else {
      this.closeMessageModal();
      await this.fetchMessages();
    }

    this.actionLoading = false;
  }

  async declineMessage() {
    if (!confirm('Are you sure you want to DECLINE this message?')) return;

    const msg = this.selectedMessage;
    const { error } = await this.supabase.getClient()
      .from('contact_msg')
      .update({ status: 'Declined', decision_by: this.user.id })
      .eq('id', msg.id);

    if (error) {
      console.error('Error declining message:', error.message);
    } else {
      this.closeMessageModal();
      await this.fetchMessages();
    }
  }
}
