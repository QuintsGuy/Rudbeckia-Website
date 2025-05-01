import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.css'
})
export class ContactComponent {
  contactForm: FormGroup;
  showSubmitConfirmModal: boolean = false;

  constructor(private fb: FormBuilder, private supabaseService: SupabaseService) {
    this.contactForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      eventDate: ['', Validators.required],
      eventType: ['', Validators.required],
      venue: [''],
      budget: ['', Validators.required],
      coordinator: [''],
      coordinatorEmail: ['', Validators.email],
      pinterest: [''],
      message: ['', Validators.required]
    });
  }

  markFieldsAsTouched() {
    Object.values(this.contactForm.controls).forEach(control => {
      control.markAsTouched();
    });
  }

  async onSubmit() {
    if (this.contactForm.invalid) {
      this.markFieldsAsTouched();
      alert("The highlighted fields below are required. Please fill in requested information.");
      return;
    }

    const formValue = this.contactForm.value;

    const { data: clientData, error: clientError } = await this.supabaseService.getClient()
      .from('clients')
      .upsert([{
        first_name: formValue.firstName,
        last_name: formValue.lastName,
        email: formValue.email,
        phone: formValue.phone
      }], { onConflict: 'email' })
      .select('client_id')
      .single();

    if (clientError) {
      console.error('❌ Client insert error:', clientError.message);
      alert('Error submitting personal data. Please try again.');
      return;
    }

    let coordinatorId = null;
    if (formValue.coordinator && formValue.coordinatorEmail) {
      const { data: coordinatorData, error: coordinatorError } = await this.supabaseService.getClient()
        .from('coordinators')
        .upsert([{
          name: formValue.coordinator,
          email: formValue.coordinatorEmail,
          updated_at: new Date().toISOString()
        }], { onConflict: 'email' })
        .select('coordinator_id')
        .single();

      if (coordinatorError) {
        console.error('❌ Coordinator insert error:', coordinatorError.message);
        alert('Error submitting coordinator info. Please try again.');
        return;
      }

      coordinatorId = coordinatorData.coordinator_id;
    }

    // Insert into inquiries
    const { error: inquiryError } = await this.supabaseService.getClient()
      .from('inquiries')
      .insert([{
        client_id: clientData.client_id,
        coordinator_id: coordinatorId,
        event_date: formValue.eventDate,
        event_type: formValue.eventType,
        venue: formValue.venue,
        budget: formValue.budget,
        pinterest_url: formValue.pinterest,
        message: formValue.message,
        is_read: false
    }]);

    // Handle any errors
    if (inquiryError) {
      console.error('❌ Error submitting contact form:', inquiryError);
      alert('Error submitting event details. Please try again.');
    } else {
      this.showSubmitConfirmModal = true;
      this.contactForm.reset();
    }
  }

  formatPhoneNumber(event: any) {
    let input = event.target.value.replace(/\D/g, ''); // Remove non-digits
  
    // Strip leading 1 if it's an 11-digit US number
    if (input.length === 11 && input.startsWith('1')) {
      input = input.substring(1);
    }
  
    input = input.substring(0, 10); // Trim to 10 digits max
  
    let formatted = '';
    if (input.length > 6) {
      formatted = `(${input.slice(0, 3)}) ${input.slice(3, 6)}-${input.slice(6)}`;
    } else if (input.length > 3) {
      formatted = `(${input.slice(0, 3)}) ${input.slice(3)}`;
    } else if (input.length > 0) {
      formatted = `(${input})`;
    }
  
    event.target.value = formatted;
  
    // Optionally: Update raw phone number in form control if needed
    this.contactForm.get('phone')?.setValue(input);
  }
  
  formatBudget(event: any) {
    let input = event.target.value.replace(/\D/g, '');
    
    if (!input) {
      this.contactForm.get('budget')?.setValue(null);
      return;
    }
  
    const numberValue = parseInt(input, 10);
    const formatted = '$' + numberValue.toLocaleString();
  
    // Show formatted value in input
    event.target.value = formatted;
  
    // Set raw numeric value in form control
    this.contactForm.get('budget')?.setValue(numberValue);
  }

  closeConfirmModal() {
    this.showSubmitConfirmModal = false;
  }
}
