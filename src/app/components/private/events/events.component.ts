import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
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
    notes: new FormControl(''),
    status: new FormControl(''),
    passcode: new FormControl(''),
  });

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
  
    const from = (this.currentPage - 1) * this.pageSize;
    const to = from + this.pageSize - 1;
  
    let query = this.supabase.getClient()
      .from('events')
      .select(`
        event_id, event_date, event_type, venue, budget, pinterest_url, notes, status, todo,
        client:clients (client_id, first_name, last_name, email, phone),
        coordinator:coordinators (coordinator_id, name, email, phone),
        passcode:passcodes (passcode)
      `, { count: 'exact' })
      .range(from, to);
  
    if (this.filterStatus !== 'All') {
      query = query.eq('status', this.filterStatus);
    }
  
    if (this.searchTerm.trim()) {
      query = query.or(
        `name.ilike.%${this.searchTerm}%,event_type.ilike.%${this.searchTerm}%,venue.ilike.%${this.searchTerm}%,coordinator.ilike.%${this.searchTerm}%`
      );
    }
  
    const { data, count, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      console.error('Failed to load events:', error.message);
      this.toast.showToast('Failed to load events:' + error.message, 'error');
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
      .select(`
        event_id, event_date, event_type, venue, budget, pinterest_url, notes, status, todo,
        client:clients (client_id, first_name, last_name, email, phone),
        coordinator:coordinators (coordinator_id, name, email, phone),
        passcode:passcodes (passcode)
      `, { count: 'exact' })
      .eq('event_id', event.event_id);

    if (error) {
      console.error('Could not open event modal:', error.message);
      this.toast.showToast('Could not open event modal.', 'error');
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
      email: event.client.email,
      phone: event.client.phone,
      event_type: event.event_type,
      event_date: event.event_date,
      venue: event.venue,
      budget: event.budget,
      coordinator: event.coordinator?.name,
      coordinator_email: event.coordinator?.email,
      pinterest_url: event.pinterest_url,
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
  
    const { error: clientError } = await this.supabase.getClient()
      .from('clients')
      .update([{
        email: this.eventForm.value.email,
        phone: this.eventForm.value.phone,
      }])
      .eq('client_id', this.selectedEvent.client.client_id);

    if (clientError) {
      console.error('Failed to update client:', clientError.message);
      this.toast.showToast('Failed to update client.', 'error');
      return;
    }

    const { error: coordinatorError } = await this.supabase.getClient()
      .from('coordinators')
      .update([{
        name: this.eventForm.value.coordinator,
        email: this.eventForm.value.coordinator_email,
        phone: this.eventForm.value.coordinator_phone
      }])
      .eq('coordinator_id', this.selectedEvent.coordinator.coordinator_id);

    if (coordinatorError) {
      console.error('Failed to update coordinator:', coordinatorError.message);
      this.toast.showToast('Failed to update coordinator.', 'error');
      return;
    }

    const { error: eventError } = await this.supabase.getClient()
      .from('events')
      .update([{
        event_date: this.eventForm.value.event_date,
        event_type: this.eventForm.value.event_type,
        venue: this.eventForm.value.venue,
        budget: this.eventForm.value.budget,
        pinterest_url: this.eventForm.value.pinterest_url,
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
      console.log("No active proposal found.");
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
    const { error: updateError } = await this.supabase.getClient()
      .from('proposals')
      .update({ is_active: false })
      .eq('event_id', this.selectedEvent.event_id)
      .eq('is_active', true);

    if (updateError) {
      console.error('Error updating active proposal: ', updateError);
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
      this.toast.showToast('Uploading proposal failed.', 'error');
      this.actionLoading = false;
      return;
    }

    //this.sendProposalEmail(this.selectedEvent);
    this.selectedEvent.status = 'Client Review';
    await this.fetchEvents();
    this.closeProposalModal();
    console.log(this.selectedEvent);
    this.toast.showToast('Proposal uploaded successfully!', 'success');
    this.proposalFile = null;
    this.proposalUploadEnabled = false;
    this.actionLoading = false;
  }

  // async sendProposalEmail(event: any) {
  //   await fetch('https://<your-project-id>.functions.supabase.co/send-proposal-email', {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify({
  //       to: event.client.email,
  //       passcode: event.passcode
  //     })
  //   });
  // }

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
