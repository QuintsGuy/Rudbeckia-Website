import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SupabaseService } from '../../../services/supabase.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './payments.component.html',
  styleUrl: './payments.component.css'
})
export class PaymentsComponent implements OnInit {
  proposalId: any;
  eventId: any;
  invoice: any;
  installments: any[] = [];
  isRedirecting: boolean = false;

  constructor(private supabase: SupabaseService, private toast: ToastService) {}
  
  ngOnInit(): void {
    const state = history.state;
    this.proposalId = state.proposal_id;
    this.eventId = state.event_id;

    if (this.proposalId && this.eventId) {
      this.loadInvoiceData();
      this.toast.showToast('Proposal Successfully Processed!', 'success');
    } else {
      console.error('Missing proposal or event ID');
      this.toast.showToast('Missing proposal or event id', 'error');
    }
  }

  async loadInvoiceData() {
    const supabase = this.supabase.getClient();
  
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
      .eq('proposal_id', this.proposalId)
      .single();
  
    if (invoiceError) {
      console.error('Invoice fetch failed', invoiceError);
      this.toast.showToast('Fetching invoice failed', 'error');
      return;
    }
  
    const { data: installments, error: installmentError } = await supabase
      .from('installments')
      .select('*')
      .eq('invoice_id', invoice.invoice_id)
      .order('due_date');
  
    if (installmentError) {
      console.error('Installments fetch failed', installmentError);
      this.toast.showToast('Fetching installments failed', 'error');
      return;
    }
  
    this.invoice = invoice;
    this.installments = installments;
  }

  async payNow() {
    this.isRedirecting = true;
    
    const deposit = this.installments?.[0];
    if (!deposit) return;
  
    // const { data, error } = await this.supabase.invokeFunction('create-checkout-session', {
    //   body: { installment_id: deposit.installment_id }
    // });

    // if (error) {
    //   console.error("Failed to create checkout session: ", error);
    //   this.toast.showToast('Failed to create checkout session', 'error');
    //   return;
    // }

    // if (data?.url) {
    //   window.location.href = data.url;
    // }
  }
}
