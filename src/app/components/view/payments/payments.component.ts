import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
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
  accessToken: any;
  proposalId: any;
  eventId: any;
  invoice: any;
  targetInstallment: any;
  installments: any[] = [];
  overdue: boolean = false;
  paid: boolean = false;
  canceled: boolean = false;
  scheduled: boolean = false;
  isRedirecting: boolean = false;

  constructor(private supabase: SupabaseService, private toast: ToastService, private route: ActivatedRoute) {}
  
  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.accessToken = params['token'];
      console.log("Token from query params: ", this.accessToken);
    })

    if (!this.accessToken) {
      console.error("Missing accessToken");
      this.toast.showToast('Missing access token', 'error');
    }

    this.loadInstallmentData();
  }

  async loadInstallmentData() {
    const supabase = this.supabase.getClient();

    const { data: installmentData, error: fetchError } = await supabase
      .from('installments')
      .select('*, invoice:invoices (*)')
      .eq('access_token', this.accessToken)
      .single()
    
    if (fetchError) {
      console.error('Installment fetch failed: ', fetchError);
      this.toast.showToast('Fetching installment failed', 'error');
      return;
    } else if (installmentData.status === 'paid') {
      console.warn("This installment has been paid and not available anymore");
      this.paid = true;
    } else if (installmentData.status === 'overdue') {
      console.warn("This installment is overdue");
      this.overdue = true;
    } else if (installmentData.status === 'scheduled') {
      console.warn("This installment is schedule but not available to view yet");
      this.scheduled = true;
    } else if (installmentData.status === 'canceled') {
      console.warn("This installment has been canceled and is not available anymore");
      this.canceled = true;
    }

    const { data: otherInstallments, error: otherError } = await supabase
      .from('installments')
      .select('*')
      .eq('invoice_id', installmentData.invoice.invoice_id)
      .order('due_date', { ascending: true });

    if (otherError) {
      console.error('Fetching other installments failed: ', otherError);
      this.toast.showToast('Fetching other installments failed', 'error');
      return;
    }

    this.invoice = installmentData.invoice;
    this.targetInstallment = installmentData;
    this.installments = otherInstallments;
  }

  async payNow() {
    this.isRedirecting = true;

    try {
      const checkoutResponse: any = await this.createCheckoutSession(this.targetInstallment.installment_id);
      console.log('Response: ', checkoutResponse);
  
      if (checkoutResponse?.url && this.isTrustedUrl(checkoutResponse.url)) {
        window.location.href = checkoutResponse.url;
      } else {
        console.error('Stripe did not return a url or untrusted/missing URL from Stripe response');
        this.toast.showToast('Failed to get Stripe checkout URL', 'error');
      }
    } catch (err) {
      console.error("Failed to create checkout session: ", err);
      this.toast.showToast('Failed to create checkout session', 'error');
    }
  }

  isTrustedUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      const allowedHosts = ['checkout.stripe.com']; // Add more domains if needed
      return allowedHosts.includes(parsedUrl.hostname);
    } catch (e) {
      return false;
    }
  }

  async createCheckoutSession(installment_id: string) {
    return fetch('https://dzyjvjalyvezqqvknazd.supabase.co/functions/v1/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ installment_id })
    }).then(async(response) => {
      const data = await response.json();
      if(!response.ok) {
        throw new Error(data.error || 'Parsing proposal failed');
      }
      return data;
    })
  } 
}
