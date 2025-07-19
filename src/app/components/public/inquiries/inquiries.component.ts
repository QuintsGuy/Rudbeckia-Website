import { Component } from '@angular/core';
import { SupabaseService } from '../../../services/supabase.service';
import { ToastService } from '../../../services/toast.service';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { StepClientComponent } from "./step-client/step-client.component";
import { StepEventComponent } from "./step-event/step-event.component";
import { StepCoordinatorComponent } from "./step-coordinator/step-coordinator.component";
import { StepPinterestComponent } from "./step-pinterest/step-pinterest.component";
import { Router } from '@angular/router';

@Component({
  selector: 'app-inquiries',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    StepClientComponent, 
    StepEventComponent, 
    StepCoordinatorComponent, 
    StepPinterestComponent, 
    ReactiveFormsModule
  ],
  templateUrl: './inquiries.component.html',
  styleUrl: './inquiries.component.css'
})
export class InquiriesComponent {   
  step = 1;
  form: FormGroup;
  
  constructor(
    private supabase: SupabaseService, 
    private toast: ToastService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({
      client: this.fb.group({
        first_name: ['', Validators.required],
        last_name: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        phone: ['', Validators.required],
        address: ['', Validators.required],
        city: ['', Validators.required],
        state: ['', Validators.required],
        zipcode: ['', Validators.required],
        preferred_contact: ['', Validators.required] 
      }),
      event: this.fb.group({
        date: ['', Validators.required],
        type: ['', Validators.required],
        venue: [''],
        city: [''],
        state: [''],
        zipcode: [''],
        budget: ['', Validators.required],
        notes: ['', Validators.required]
      }),
      coordinator: this.fb.group({
        first_name: [''],
        last_name: [''],
        email: [''],
        phone: ['']
      }),
      pinterest: this.fb.group({
        urls: this.fb.control([]),
        images: this.fb.control([])
      })
    })
  }

  get clientForm(): FormGroup {
    return this.form.get('client') as FormGroup;
  }

  get eventForm(): FormGroup {
    return this.form.get('event') as FormGroup;
  }

  get coordinatorForm(): FormGroup {
    return this.form.get('coordinator') as FormGroup;
  }

  get pinterestForm(): FormGroup {
    return this.form.get('pinterest') as FormGroup;
  }

  nextStep() {
    const stepKeys = ['client', 'event', 'coordinator', 'pinterest'];
    const currentKey = stepKeys[this.step - 1];
    const currentGroup = this.form.get(currentKey) as FormGroup;

    if (currentGroup.invalid) {
      currentGroup.markAllAsTouched();
      this.toast.showToast('Please fill in all required fields.', 'error');
      return;
    }
    
    if (this.step < 4) this.step++;
  }

  prevStep() {
    if (this.step > 1) this.step--;
  }

  async submit() {
    const { client, coordinator, event, pinterest } = this.form.value;
    
    try {      
      // 1. Insert client
      const { data: clientData, error: clientError } = await this.supabase.getClient()
        .from('clients')
        .upsert( client , { onConflict: 'email' })
        .select('*')
        .single();

      if (clientError) throw clientError;

      // 2. Insert coordinator (optional)
      let coordinatorData = null;
      if (coordinator.email) {
        const { data: coordData, error: coordError } = await this.supabase.getClient()
          .from('coordinators')
          .upsert(coordinator, { onConflict: 'email' })
          .select('*')
          .single();

        if (coordError) throw coordError;
        coordinatorData = coordData;
      }
      
      // 3. Insert event
      const { data: eventData, error: eventError } = await this.supabase.getClient()
        .from('events')
        .insert({
          ...event,
          client_id: clientData.client_id,
          coordinator_id: coordinatorData?.coordinator_id || null
        })
        .select()
        .single();

      if (eventError) throw eventError;
      const eventId = event.event_id;

      // 2. Upload any image files from Pinterest
      for (const file of pinterest.images) {
        const { error: fileError } = await this.supabase.getClient().storage
          .from('pinterest-inspo')
          .upload(`${eventId}/${file.name}`, file);
        
        if (fileError) throw fileError;
      }

      const urlRecords = pinterest.urls
        .filter((url: string) => !!url.trim())
        .map((url: string) => ({ event_id: eventId, url }));

      if (urlRecords.length > 0) {
        const { error: urlError } = await this.supabase.getClient()
          .from('pinterest_urls')
          .insert(urlRecords);

        if (urlError) throw urlError;
      }

      this.sendInquiryEmails(
        client.email, 
        `${client.first_name} ${client.last_name}`, 
        client.phone, 
        event.type, 
        event.date, 
        event.venue, 
        event.notes
      );

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
