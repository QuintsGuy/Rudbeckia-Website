import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { SupabaseService } from '../../../services/supabase.service';
import { Router } from '@angular/router';
import { ViewChild, ElementRef } from '@angular/core';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './events.component.html',
  styleUrl: './events.component.css'
})
export class EventsComponent implements OnInit {
  events: any[] = [];
  selectedEvent: any = null;
  loading: boolean = true;
  actionLoading: boolean = false;
  user: any;

  filterStatus: string = 'Active';
  searchTerm: string = '';
  currentPage: number = 1;
  pageSize: number = 10;
  totalRecords: number = 0;

  selectedIds: Set<number> = new Set();

  searchForm: FormGroup = new FormGroup({
    searchTerm: new FormControl('')
  });

  eventForm: FormGroup = new FormGroup({
    date: new FormControl(''),
    type: new FormControl(''),
    venue: new FormControl(''),
    city: new FormControl(''),
    state: new FormControl(''),
    zipcode: new FormControl(''),
    budget: new FormControl(''),
    notes: new FormControl(''),
    status: new FormControl(''),
    isActive: new FormControl(''),
    passcode: new FormControl('')
  });

  states = [
    { name: 'Alabama', abbreviation: 'AL' },
    { name: 'Alaska', abbreviation: 'AK' },
    { name: 'Arizona', abbreviation: 'AZ' },
    { name: 'Arkansas', abbreviation: 'AR' },
    { name: 'California', abbreviation: 'CA' },
    { name: 'Colorado', abbreviation: 'CO' },
    { name: 'Connecticut', abbreviation: 'CT' },
    { name: 'Delaware', abbreviation: 'DE' },
    { name: 'Florida', abbreviation: 'FL' },
    { name: 'Georgia', abbreviation: 'GA' },
    { name: 'Hawaii', abbreviation: 'HI' },
    { name: 'Idaho', abbreviation: 'ID' },
    { name: 'Illinois', abbreviation: 'IL' },
    { name: 'Indiana', abbreviation: 'IN' },
    { name: 'Iowa', abbreviation: 'IA' },
    { name: 'Kansas', abbreviation: 'KS' },
    { name: 'Kentucky', abbreviation: 'KY' },
    { name: 'Louisiana', abbreviation: 'LA' },
    { name: 'Maine', abbreviation: 'ME' },
    { name: 'Maryland', abbreviation: 'MD' },
    { name: 'Massachusetts', abbreviation: 'MA' },
    { name: 'Michigan', abbreviation: 'MI' },
    { name: 'Minnesota', abbreviation: 'MN' },
    { name: 'Mississippi', abbreviation: 'MS' },
    { name: 'Missouri', abbreviation: 'MO' },
    { name: 'Montana', abbreviation: 'MT' },
    { name: 'Nebraska', abbreviation: 'NE' },
    { name: 'Nevada', abbreviation: 'NV' },
    { name: 'New Hampshire', abbreviation: 'NH' },
    { name: 'New Jersey', abbreviation: 'NJ' },
    { name: 'New Mexico', abbreviation: 'NM' },
    { name: 'New York', abbreviation: 'NY' },
    { name: 'North Carolina', abbreviation: 'NC' },
    { name: 'North Dakota', abbreviation: 'ND' },
    { name: 'Ohio', abbreviation: 'OH' },
    { name: 'Oklahoma', abbreviation: 'OK' },
    { name: 'Oregon', abbreviation: 'OR' },
    { name: 'Pennsylvania', abbreviation: 'PA' },
    { name: 'Rhode Island', abbreviation: 'RI' },
    { name: 'South Carolina', abbreviation: 'SC' },
    { name: 'South Dakota', abbreviation: 'SD' },
    { name: 'Tennessee', abbreviation: 'TN' },
    { name: 'Texas', abbreviation: 'TX' },
    { name: 'Utah', abbreviation: 'UT' },
    { name: 'Vermont', abbreviation: 'VT' },
    { name: 'Virginia', abbreviation: 'VA' },
    { name: 'Washington', abbreviation: 'WA' },
    { name: 'West Virginia', abbreviation: 'WV' },
    { name: 'Wisconsin', abbreviation: 'WI' },
    { name: 'Wyoming', abbreviation: 'WY' }
  ];

  proposalFile: File | null = null;
  proposalUploadEnabled: boolean = false;
  @ViewChild('proposalFileInput') proposalFileInput?: ElementRef<HTMLInputElement>;

  constructor(
    private supabase: SupabaseService, 
    private router: Router,
    private toast: ToastService
  ) {}

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
    this.events = [];
  
    const from = (this.currentPage - 1) * this.pageSize;
    const to = from + this.pageSize - 1;
  
    let query = this.supabase.getClient()
      .from('events')
      .select(`*,
        client:clients (*),
        coordinator:coordinators (*),
        urls:pinterest_urls (*),
        passcode:passcodes (passcode)
      `, { count: 'exact' })
      .range(from, to);
  
    switch (this.filterStatus) {
      case 'Active':
        query = query.eq('isActive', true);
        break;
      case 'New Inquiries':
        query = query.eq('isActive', false).eq('status', 'pending');
        break;
      case 'Declined':
        query = query.eq('isActive', false).in('status', ['declined', 'cancelled']);
        break;
      case 'Complete':
        query = query.eq('isActive', false).eq('status', 'complete');
        break;
      default:
        // Optionally fetch all or show nothing
        break;
    }
  
    if (this.searchTerm.trim()) {
      query = query.or(
        `name.ilike.%${this.searchTerm}%,type.ilike.%${this.searchTerm}%,venue.ilike.%${this.searchTerm}%,coordinator.ilike.%${this.searchTerm}%`
      );
    }
  
    const { data, count, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      console.error('Failed to load events:', error.message);
      this.toast.showToast('Failed to load events', 'error');
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

  getActionLabel(status: string | null): string | null {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'Accept / Decline';
      case 'accepted':
        return 'Draft Proposal';
      case 'client review':
      case 'declined':
      case 'complete':
      case 'cancelled':
        return null;
      case 'proposal accepted':
        return 'Execute Order Details';
      case 'proposal declined':
        return 'Resubmit Proposal';
      case 'refund requested':
        return 'Refund Payments';
      default:
        return null;
    }
  }

  async handleAccept(event: any) {
    this.actionLoading = true;

    const { error } = await this.supabase.getClient()
      .from('events')
      .update({ status: 'accepted', isActive: true })
      .eq('event_id', event.event_id);

    if (error) {
      console.error('Failed to accept event:', error.message);
      this.toast.showToast('Failed to accept event.', 'error');
    } else {
      this.toast.showToast('Event accepted!', 'success');
      await this.fetchEvents();
    }

    this.actionLoading = false;
  }

  async handleDecline(event: any) {
    this.actionLoading = true;

    const { error } = await this.supabase.getClient()
      .from('events')
      .update({ status: 'declined', isActive: false })
      .eq('event_id', event.event_id);

    if (error) {
      console.error('Failed to decline event:', error.message);
      this.toast.showToast('Failed to decline event.', 'error');
    } else {
      this.toast.showToast('Event declined.', 'success');
      await this.fetchEvents();
    }

    this.actionLoading = false;
  }

  async openEventModal(event: any) {
    this.selectedEvent = event;

    const { error } = await this.supabase.getClient()
      .from('events')
      .select(`*,
        client:clients (*),
        coordinator:coordinators (*),
        passcode:passcodes (passcode)
      `, { count: 'exact' })
      .eq('event_id', event.event_id);

    if (error) {
      console.error('Could not open event modal:', error.message);
      this.toast.showToast('Could not open event modal.', 'error');
    }

    const { data: files, error: storageError } = await this.supabase.getClient().storage
      .from('pinterest-inspo')
      .list(`${event.event_id}`);

    if (storageError) {
      console.error('Error fetching inspiration images:', storageError.message);
      this.toast.showToast('Could not load inspiration images.', 'error');
      event.inspirationImages = [];
    } else {
      event.inspirationImages = files.map(file =>
        this.supabase.getClient()
          .storage
          .from('pinterest-inspo')
          .getPublicUrl(`${event.event_id}/${file.name}`).data.publicUrl
      );
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
    this.eventForm.patchValue({
      name: `${event.client.first_name} ${event.client.last_name}`,
      type: event.type,
      date: event.date,
      venue: event.venue,
      city: event.city,
      state: event.state,
      zipcode: event.zipcode,
      budget: event.budget,
      notes: event.notes,
      status: event.status,
      passcode: event.passcode?.passcode,
    });

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

    const { error: eventError } = await this.supabase.getClient()
      .from('events')
      .update([{
        date: this.eventForm.value.date,
        type: this.eventForm.value.type,
        venue: this.eventForm.value.venue,
        city: this.eventForm.value.city,
        state: this.eventForm.value.state,
        zipcode: this.eventForm.value.zipcode,
        budget: this.eventForm.value.budget,
        notes: this.eventForm.value.notes,
        status: this.eventForm.value.status
      }])
      .eq('event_id', this.selectedEvent.event_id);
  
    if (eventError) {
      console.error('Failed to update event:', eventError.message);
      this.toast.showToast('Failed to update event.', 'error');
    } else {
      await this.fetchEvents();
      this.closeModifyEventModal();
      this.toast.showToast('Event modified successfully!', 'success');
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

    const { data: proposal, error } = await this.supabase.getClient()
      .from('proposals')
      .select("proposal_id, pdf_url, is_active, version")
      .eq('event_id', this.selectedEvent.event_id)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle()

    if (error && error.code !== 'PGRST116'){
      console.error('Error fetching active proposal: ', error);
      return;
    }

    if (!proposal) {
      this.selectedEvent.proposal = null;
    }

    this.selectedEvent.proposal = proposal;
    
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
    const filePath = `${this.selectedEvent.event_id}/${this.proposalFile.name}`;
    const { data: { publicUrl } } = this.supabase.getClient().storage
      .from('proposals')
      .getPublicUrl(filePath);
    
    // Step 1: Check if any proposals exist for the event
    const { data: proposals, error: fetchError } = await this.supabase.getClient()
      .from('proposals')
      .select('version, proposal_id')
      .eq('event_id', this.selectedEvent.event_id)

    if (fetchError) {
      console.error('Error fetching active proposal:', fetchError);
      this.toast.showToast('Fetching proposal failed.', 'error');
      return;
    }

    // Step 2: If proposals exist, find the active one and imcrement its version
    let newVersion = 1;
    if (proposals.length > 0) {
      const activeProposal = proposals.find((proposal: any) => proposal.is_active);

      if (activeProposal) {
        newVersion = parseInt(activeProposal.version) + 1;
      } else {
        newVersion = 1;
      }
    }

    // Step 3: Deactivate active proposal before inserting the new one
    const { error: updateProposalError } = await this.supabase.getClient()
      .from('proposals')
      .update({ is_active: false })
      .eq('event_id', this.selectedEvent.event_id)
      .eq('is_active', true);

    if (updateProposalError) {
      console.error('Error updating active proposal: ', updateProposalError);
      this.toast.showToast('Modifying proposal failed.', 'error');
      return;
    }

    // Step 4: Insert the new proposal with the incremented version
    const { error: insertError } = await this.supabase.getClient()
      .from('proposals')
      .insert({ 
        event_id: this.selectedEvent.event_id,
        pdf_url: publicUrl,
        status: 'in-review',
        version: newVersion.toString(),
        is_active: true
      });

    if (insertError) {
      console.error('Error inserting new proposal:', insertError);
      this.toast.showToast('Submitting new proposal failed.', 'error');
      return;
    }

    const { error: uploadError } = await this.supabase.getClient().storage
      .from('proposals')
      .upload(filePath, this.proposalFile, { upsert: true });

    if (uploadError) {
      console.error('Uploading proposal failed.', 'error');
      this.toast.showToast('Uploading proposal failed.');
      this.actionLoading = false;
      return;
    }

    const { error: updateEventError} = await this.supabase.getClient()
      .from('events')
      .update({ status: 'client review' })
      .eq('event_id', this.selectedEvent.event_id);

    if (updateEventError) {
      console.error('Updating event status failed.', updateEventError);
      this.toast.showToast('Updating event status failed.');
      this.actionLoading = false;
      return;
    }

    var email = this.selectedEvent.client.email;
    var name = `${this.selectedEvent.client.first_name} ${this.selectedEvent.client.last_name}`;
    var passcode = this.selectedEvent.passcode.passcode;
    
    this.sendProposalEmail(email, name, passcode);
    await this.fetchEvents();
    this.closeProposalModal();
    this.toast.showToast('Proposal uploaded successfully!', 'success');
    this.proposalFile = null;
    this.proposalUploadEnabled = false;
    this.actionLoading = false;
  }

  async sendProposalEmail(email: string, name: string, passcode: string): Promise<string> {
    return fetch('https://dzyjvjalyvezqqvknazd.supabase.co/functions/v1/send-proposal-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, passcode })
    }).then(async (response) => {
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Email failed to send');
      }
      return data.message;
    });
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
}
