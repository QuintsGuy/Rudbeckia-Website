import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { SupabaseService } from '../../../services/supabase.service';
import { SafeUrlPipe } from '../../shared/pipes/safe-url.pipe';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-proposals',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SafeUrlPipe, HttpClientModule],
  templateUrl: './proposal.component.html',
  styleUrl: './proposal.component.css'
})
export class ProposalComponent implements OnInit {
  passcode: string = '';
  passcodeData: any;
  event: any;
  proposal: any;
  isLoading: boolean = false;

  constructor(private http: HttpClient, private router: Router, private supabase: SupabaseService) {}

  ngOnInit(): void {
    this.passcode = history.state.passcode.passcode;

    if (this.passcode) {
      this.fetchProposalData(this.passcode);
    } else {
      console.error('No valid passcode data found.');
    }
  }

  async fetchProposalData(passcode: string): Promise<void> {    
    try {
      const { data: passcodeData, error } = await this.supabase.getClient()
        .from('passcodes')
        .select(`
          *,
          event:events (
            event_id,
            client_id,
            proposal:proposals (
              proposal_id,
              pdf_url,
              is_active
            )
          )
        `)
        .eq('passcode', passcode)
        .single()
      
      if (error || !passcodeData) {
        console.error('Error fetching event data:', error);
        return;
      }

      this.event = passcodeData.event;
      this.proposal = passcodeData.event.proposal[0];

      if (!this.proposal) {
        console.error('No active proposal found for this event.');
      }
    } catch (error) {
      console.error('Error fetching event data:', error);
    }
  }

  agreedToTerms: boolean = false;
  digitallySigned: boolean = false;

  async acceptProposal() {
    if (!this.proposal || !this.event) return;

    this.isLoading = true;

    try {      
      let proposal_path = this.proposal.pdf_url.replace('https://dzyjvjalyvezqqvknazd.supabase.co/storage/v1/object/public/proposals/', '');
      let proposal_id = this.proposal.proposal_id;
      let event_id = this.event.event_id;
      let client_id = this.event.client_id;

      const parseResponse: any = await this.parseProposal(proposal_path, proposal_id, event_id, client_id);
      console.log(parseResponse);
      console.log("InvoiceID: ", parseResponse.invoiceId);

      const invoiceId = parseResponse.invoiceId;
      const { data: installmentData, error: fetchError } = await this.supabase.getClient()
        .from("installments")
        .select('*, client:clients (*)')
        .eq('invoice_id', invoiceId)
        .eq('description', 'Deposit')
        .single()

      if (fetchError) {
        console.error("Error fetching installment data: ", fetchError);
      }

      const { error: updateError } = await this.supabase.getClient()
        .from("installments")
        .update({ status: "pending"})
        .eq("installment_id", installmentData.installment_id)

      if (updateError) {
        console.error("Error updating installment data: ", updateError);
      }

      let name = installmentData.client.first_name;
      let email = installmentData.client.email;
      let amount = installmentData.amount;
      let expiresAt = installmentData.due_date;
      let accessToken = installmentData.access_token;

      console.log(name, email, amount, expiresAt, accessToken);

      const emailResponse: any = await this.sendInstallmentEmail(name, email, amount, expiresAt, accessToken);

      console.log("Email Response: ", emailResponse);

      this.router.navigate(['/view/payments'], {
        queryParams: {
          token: installmentData.access_token
        }
      });
    } catch (err) {
      console.error('Parsing failed:', err);
      this.isLoading = false;
    }

    const { error: updateEventError} = await this.supabase.getClient()
      .from('events')
      .update({ status: 'proposal accepted' })
      .eq('event_id', this.event.event_id);

    if (updateEventError) {
      console.log('Updating event status failed.', updateEventError);
      return;
    }
  }

  async declineProposal(): Promise<void> {
    console.log('Proposal declined.');
    
    const { error: updateEventError} = await this.supabase.getClient()
      .from('events')
      .update({ status: 'proposal declined' })
      .eq('event_id', this.event.event_id);

    if (updateEventError) {
      console.log('Updating event status failed.', updateEventError);
      return;
    }
  }

  async parseProposal(proposal_path: string, proposal_id: string, event_id: string, client_id: string) {
    return fetch('https://dzyjvjalyvezqqvknazd.supabase.co/functions/v1/parse-proposal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proposal_path, proposal_id, event_id, client_id })
    }).then(async(response) => {
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Parsing proposal failed');
      }
      
      return {
        invoiceId: data.invoice_id,
        parsedJsonText: data.parsed
      };
    });
  }

  async sendInstallmentEmail(name: string, email: string, amount: string, expiresAt: string, accessToken: string): Promise<string> {
    return fetch('https://dzyjvjalyvezqqvknazd.supabase.co/functions/v1/send-installment-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, amount, expiresAt, accessToken })
    }).then(async(response) => {
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Email failed to send');
      }
      return data.message;
    })
  }
}
