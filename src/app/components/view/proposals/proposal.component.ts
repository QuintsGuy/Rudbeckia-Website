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

    const proposalPayload = {
      proposal_path: this.proposal.pdf_url.replace('https://dzyjvjalyvezqqvknazd.supabase.co/storage/v1/object/public/proposals/', ''),
      proposal_id: this.proposal.proposal_id,
      event_id: this.event.event_id,
      client_id: this.event.client_id
    };

    this.isLoading = true;

    try {      
      const parseResponse: any = await this.http.post('https://dzyjvjalyvezqqvknazd.supabase.co/functions/v1/parse-proposal', 
        proposalPayload,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      ).toPromise();
      const invoiceId = parseResponse.invoice_id;
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
      
      console.log(installmentData);

      const emailPayload = {
        name: installmentData.client.first_name,
        email: installmentData.client.email,
        amount: installmentData.amount,
        expiresAt: installmentData.due_date,
        accessToken: installmentData.access_token
      }
      const emailResponse: any = await this.http.post('https://dzyjvjalyvezqqvknazd.supabase.co/functions/v1/send-installment-email',
        emailPayload,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      ).toPromise();

      console.log("Email Response: ", emailResponse);

      this.router.navigate(['/view/payments'], {
        state: {
          proposal_id: this.proposal.proposal_id,
          event_id: this.event.event_id
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

  declineProposal(): void {
    console.log('Proposal declined.');
    // Add real rejection logic here
  }
}
