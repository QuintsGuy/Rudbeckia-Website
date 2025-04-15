import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { SupabaseService } from '../../../services/supabase.service';
import { Router } from '@angular/router';
import { ViewChild, ElementRef } from '@angular/core';

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './events.component.html',
  styleUrl: './events.component.css'
})
export class EventsComponent {
  events: any[] = [];
  selectedEvent: any = null;
  loading: boolean = true;
  actionLoading: boolean = false;
  user: any;

  filterStatus: string = 'All';
  searchTerm: string = '';
  currentPage: number = 1;
  pageSize: number = 10;
  totalRecords: number = 0;

  selectedIds: Set<number> = new Set();

  searchForm: FormGroup = new FormGroup({
    searchTerm: new FormControl('')
  });

  eventForm: FormGroup = new FormGroup({
    name: new FormControl(''),
    email: new FormControl(''),
    phone: new FormControl(''),
    event_type: new FormControl(''),
    event_date: new FormControl(''),
    venue: new FormControl(''),
    budget: new FormControl(''),
    coordinator: new FormControl(''),
    coordinator_email: new FormControl(''),
    pinterest_url: new FormControl(''),
    message: new FormControl(''),
    status: new FormControl(''),
    passcode: new FormControl(''),
  });

  proposalFile: File | null = null;
  proposalUploadEnabled: boolean = false;
  @ViewChild('proposalFileInput') proposalFileInput?: ElementRef<HTMLInputElement>;

  toastMessage: string = '';
  toastType: 'success' | 'error' = 'success';

  constructor(private supabase: SupabaseService, private router: Router) {}

  async ngOnInit() {
    const session = await this.supabase.getClient().auth.getSession();
    this.user = session.data.session?.user;
    this.eventForm.get('passcode')?.disable();

    if (!this.user || this.user.user_metadata?.isAdmin !== true) {
      this.router.navigate(['/']);
      return;
    }

    this.searchForm.get('searchTerm')?.valueChanges.subscribe(value => {
      this.searchTerm = value;
      this.currentPage = 1;
      this.fetchEvents();
    });

    await this.fetchEvents();
  }

  async fetchEvents() {
    this.loading = true;

    const from = (this.currentPage - 1) * this.pageSize;
    const to = from + this.pageSize - 1;

    let query = this.supabase.getClient()
      .from('events')
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
      console.error('Failed to load events:', error.message);
      this.showToast('Failed to load events:' + error.message, 'error');
    } else {
      this.events = data || [];
      this.totalRecords = count || 0;
    }
    this.loading = false;
  }

  onFilterChange(status: string) {
    this.filterStatus = status;
    this.currentPage = 1;
    this.fetchEvents();
  }

  nextPage() {
    if ((this.currentPage * this.pageSize) < this.totalRecords) {
      this.currentPage++;
      this.fetchEvents();
    }
  }
  
  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.fetchEvents();
    }
  }

  async openEventModal(event: any) {
    this.selectedEvent = event;

    const { error } = await this.supabase.getClient()
      .from('events')
      .select("*")
      .eq('id', event.id);

    if (error) {
      console.error('Could not open event modal:', error.message);
      this.showToast('Could not open event modal:' + error.message, 'success');
    }
    
    const modal = document.getElementById('viewEventModal');
    const modalWrapper = modal?.querySelector('.modal-wrapper');
    
    if (modal && modalWrapper) {
      modal.classList.remove('hidden');
      setTimeout(() => {
        modalWrapper.classList.remove('opacity-0', 'scale-95');
        modalWrapper.classList.add('opacity-100', 'scale-100');
      }, 10);
    }
  }

  closeEventModal(preserveEvent: boolean = false) {
    const modal = document.getElementById('viewEventModal');
    const modalWrapper = modal?.querySelector('.modal-wrapper');
  
    if (modal && modalWrapper) {
      modalWrapper.classList.add('opacity-0', 'scale-95');
      modalWrapper.classList.remove('opacity-100', 'scale-100');
      setTimeout(() => {
        modal.classList.add('hidden');
        if (!preserveEvent) {
          this.selectedEvent = null;
        }
      }, 200);
    }
  }

  async openModifyEventModal(event: any) {
    this.selectedEvent = event;
    this.eventForm.patchValue(event);
    this.closeEventModal(true);
  
    const modal = document.getElementById('modifyEventModal');
    const modalWrapper = modal?.querySelector('.modal-wrapper');
  
    if (modal && modalWrapper) {
      modal.classList.remove('hidden');
      setTimeout(() => {
        modalWrapper.classList.remove('opacity-0', 'scale-95');
        modalWrapper.classList.add('opacity-100', 'scale-100');
      }, 10);
    }
  }

  async saveEventChanges() {
    this.actionLoading = true;
  
    const { error } = await this.supabase.getClient()
      .from('events')
      .update(this.eventForm.value)
      .eq('id', this.selectedEvent.id);
  
    if (error) {
      console.error('Failed to update event:', error.message);
      this.showToast('Failed to update event: ' + error.message, 'error');
    } else {
      await this.fetchEvents(); // reload updated data
      this.closeModifyEventModal();
      this.showToast('Event modified successfully!', 'success');
    }
  
    this.actionLoading = false;
  }

  closeModifyEventModal() {
    const modal = document.getElementById('modifyEventModal');
    const modalWrapper = modal?.querySelector('.modal-wrapper');
  
    if (modal && modalWrapper) {
      modalWrapper.classList.add('opacity-0', 'scale-95');
      modalWrapper.classList.remove('opacity-100', 'scale-100');
      setTimeout(() => {
        modal.classList.add('hidden');
        this.selectedEvent = null;
      }, 200);
    }
  }

  async openProposalModal(event: any) {
    this.selectedEvent = event;
    this.closeEventModal(true);

    const { error } = await this.supabase.getClient()
      .from('events')
      .update("*")
      .eq('id', event.id);

    if (error) {
      this.showToast('Could not open event modal: ' + error.message, 'error');
    }
    
    const modal = document.getElementById('proposalModal');
    const modalWrapper = modal?.querySelector('.modal-wrapper');
    
    if (modal && modalWrapper) {
      modal.classList.remove('hidden');
      setTimeout(() => {
        modalWrapper.classList.remove('opacity-0', 'scale-95');
        modalWrapper.classList.add('opacity-100', 'scale-100');
      }, 10);
    }
  }

  onProposalFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0] ?? null;

    if (file && file.type !== 'application/pdf') {
      alert('Only PDF files are allowed. Please select a valid PDF.');
      this.proposalFile = null;
      input.value = '';
      this.proposalUploadEnabled = false;
      // Optional: Add red border using class binding
      return;
    }

    this.proposalFile = file;
    this.proposalUploadEnabled = true;
  }

  enableProposalEdit() {
    const confirmed = confirm('Are you sure you want to modify the existing proposal?');
    if (confirmed) {
      this.proposalUploadEnabled = true;
    }
  }

  async uploadProposal() {
    if (!this.proposalFile || !this.selectedEvent) return;
  
    const confirmUpload = confirm('Do you want to upload this proposal PDF?');
    if (!confirmUpload) return;
  
    this.actionLoading = true;
    const filePath = `${this.selectedEvent.id}/${this.proposalFile.name}`;
  
    const { error: uploadError } = await this.supabase.getClient().storage
      .from('proposals')
      .upload(filePath, this.proposalFile, { upsert: true });
  
    if (uploadError) {
      alert('Upload failed: ' + uploadError.message);
      this.showToast('Upload failed: ' + uploadError.message, 'error');
      this.actionLoading = false;
      return;
    }
  
    const { data: { publicUrl } } = this.supabase.getClient().storage
      .from('proposals')
      .getPublicUrl(filePath);
  
    const { error: updateError } = await this.supabase.getClient()
      .from('events')
      .update({ 
        proposal_pdf_url: publicUrl,
        status: 'Client Review'
      })
      .eq('id', this.selectedEvent.id);
  
    if (updateError) {
      this.showToast('Database update failed: ' + updateError.message, 'error');
    } else {
      this.selectedEvent.proposal_pdf_url = publicUrl;
      this.selectedEvent.status = 'Client Review';
      await this.fetchEvents();
      this.closeProposalModal();
      this.showToast('Proposal uploaded successfully!', 'success');
    }
  
    this.proposalFile = null;
    this.proposalUploadEnabled = false;
    this.actionLoading = false;
  }

  closeProposalModal() {
    const modal = document.getElementById('proposalModal');
    const modalWrapper = modal?.querySelector('.modal-wrapper');
  
    if (modal && modalWrapper) {
      modalWrapper.classList.add('opacity-0', 'scale-95');
      modalWrapper.classList.remove('opacity-100', 'scale-100');
  
      setTimeout(() => {
        modal.classList.add('hidden');
  
        // ✅ Reset all modal state
        this.selectedEvent = null;
        this.proposalFile = null;
        this.proposalUploadEnabled = false;
  
        // ✅ Reset form to default values
        this.eventForm.reset();
  
        // ✅ Reset file input visually
        if (this.proposalFileInput?.nativeElement) {
          this.proposalFileInput.nativeElement.value = '';
        }
      }, 200);
    }
  }

  showToast(message: string, type: 'success' | 'error' = 'success') {
    const toast = document.getElementById('toast');
    this.toastMessage = message;
    this.toastType = type;
  
    if (toast) {
      toast.classList.remove('hidden');
      setTimeout(() => toast.classList.add('opacity-100'), 50);
  
      setTimeout(() => {
        toast.classList.remove('opacity-100');
        setTimeout(() => toast.classList.add('hidden'), 500);
      }, 4000);
    }
  }

  dismissToast() {
    const toast = document.getElementById('toast');
    if (toast) {
      toast.classList.remove('opacity-100');
      setTimeout(() => toast.classList.add('hidden'), 500);
    }
  }
}
