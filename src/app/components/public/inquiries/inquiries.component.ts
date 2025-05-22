import { Component } from '@angular/core';
import { SupabaseService } from '../../../services/supabase.service';
import { ToastService } from '../../../services/toast.service';
import { CommonModule } from '@angular/common';
import { Form, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { StepClientComponent } from "./step-client/step-client.component";
import { StepEventComponent } from "./step-event/step-event.component";
import { StepCoordinatorComponent } from "./step-coordinator/step-coordinator.component";
import { StepPinterestComponent } from "./step-pinterest/step-pinterest.component";
import { Router } from '@angular/router';

@Component({
  selector: 'app-inquiries',
  standalone: true,
  imports: [CommonModule, FormsModule, StepClientComponent, StepEventComponent, StepCoordinatorComponent, StepPinterestComponent, ReactiveFormsModule],
  templateUrl: './inquiries.component.html',
  styleUrl: './inquiries.component.css'
})
export class InquiriesComponent {  
  constructor(
    private supabase: SupabaseService, 
    private toast: ToastService,
    private router: Router
  ) {}
  
  step = 1;

  formData = {
    client: {
      first_name: '', last_name: '', email: '', phone: '',
      address: '', city: '', state: '', zipcode: '', preferred_contact: ''
    },
    event: {
      date: '', type: '', venue: '', city: '', state: '', zipcode: '',
      budget: '', notes: ''
    },
    coordinator: {
      first_name: '', last_name: '', email: '', phone: ''
    },
    pinterest: {
      urls: [] as string[], images: [] as File[] // image files to upload
    }
  };

  nextStep() {
    if (this.step < 4) this.step++;
  }

  prevStep() {
    if (this.step > 1) this.step--;
  }

  async submit() {
    try {      
      // 1. Insert client
      const { data: client, error: clientError } = await this.supabase.getClient()
        .from('clients')
        .upsert( this.formData.client , { onConflict: 'email' })
        .select('*')
        .single();
      if (clientError) throw clientError;

      // 2. Insert coordinator (optional)
      let coordinator = null;
      if (this.formData.coordinator.email) {
        const { data: coord, error: coordError } = await this.supabase.getClient()
          .from('coordinators')
          .upsert(this.formData.coordinator, { onConflict: 'email' })
          .select('*')
          .single();
        if (coordError) throw coordError;
        coordinator = coord;
      }
      
      // 3. Insert event
      const { data: event, error: eventError } = await this.supabase.getClient()
        .from('events')
        .insert({
          ...this.formData.event,
          client_id: client.client_id,
          coordinator_id: coordinator?.coordinator_id || null
        })
        .select()
        .single();

      if (eventError) throw eventError;
      const eventId = event.event_id;

      // 2. Upload any image files from Pinterest
      for (const file of this.formData.pinterest.images) {
        const { error: fileError } = await this.supabase.getClient().storage
          .from('pinterest-inspo')
          .upload(`${eventId}/${file.name}`, file);
        
        if (fileError) throw fileError;
      }

      const urlRecords = this.formData.pinterest.urls
        .filter(url => !!url.trim())
        .map(url => ({ event_id: eventId, url }));

      if (urlRecords.length > 0) {
        const { error: urlError } = await this.supabase.getClient()
          .from('pinterest_urls')
          .insert(urlRecords);

        if (urlError) throw urlError;
      }

      const fullName = `${client.first_name} ${client.last_name}`;
      this.sendInquiryEmails(client.email, fullName, client.phone, event.type, event.date, event.venue, event.notes);

      this.toast.showToast('Inquiry submitted successfully!', 'success');
      this.step = 1;
      this.router.navigate(['/inquiries/success']);
    } catch (err) {
      console.error("Submission error: ", err);
      this.toast.showToast('There was a problem submitting the form.', 'error');
    }
  };

  async sendInquiryEmails(email: string, name: string, phone: string, type: string, date: string, venue: string, notes: string): Promise<string> {
    return fetch('https://dzyjvjalyvezqqvknazd.supabase.co/functions/v1/handle-inquiry-emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, phone, type, date, venue, notes })
    }).then(async (response) => {
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Emails failed to send');
      }
      return data.message;
    });
  }
}
