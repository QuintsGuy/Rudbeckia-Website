import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from '../../../services/supabase.service';
import { SafeUrlPipe } from '../../shared/pipes/safe-url.pipe';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-proposals',
  standalone: true,
  imports: [CommonModule, FormsModule, SafeUrlPipe],
  templateUrl: './proposal.component.html',
  styleUrl: './proposal.component.css'
})
export class ProposalComponent implements OnInit {
  passcode: string = '';
  passcodeData: any;
  event: any;
  proposal: any;

  constructor(private router: Router, private supabase: SupabaseService) {}

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
            proposal:proposals (
              proposal_id,
              pdf_url,
              is_active
            )
          )
        `)
        .eq('passcode', passcode)
        .single()

      console.log(passcodeData);
      console.log(error);
      
      if (error || !passcodeData) {
        console.error('Error fetching event data:', error);
        return;
      }

      this.proposal = passcodeData.event.proposal[0];
      console.log(this.proposal);

      if (!this.proposal) {
        console.error('No active proposal found for this event.');
      }
    } catch (error) {
      console.error('Error fetching event data:', error);
    }
  }

  agreedToTerms: boolean = false;
  digitallySigned: boolean = false;

  acceptProposal(): void {
    console.log('Proposal accepted.');
    // Add real submission logic here
  }

  declineProposal(): void {
    console.log('Proposal declined.');
    // Add real rejection logic here
  }

  openTermsModal(): void {
    // Open a modal — placeholder for now
    alert("Show Terms & Conditions modal here.");
  }
}
