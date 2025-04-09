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
    const fullName = `${formValue.firstName} ${formValue.lastName}`;
    console.log(formValue);

    const { error } = await this.supabaseService.getClient()
      .from('contact_msg')
      .insert([{
        name: fullName,
        email: formValue.email,
        phone: formValue.phone,
        event_date: formValue.eventDate,
        event_type: formValue.eventType,
        venue: formValue.venue,
        budget: formValue.budget,
        coordinator: formValue.coordinator,
        coordinator_email: formValue.coordinatorEmail,
        pinterest_url: formValue.pinterest,
        message: formValue.message,
        is_read: false
      }]);
    
    if (error) {
      console.error('❌ Error submitting contact form:', error.message);
    } else {
      alert('✅ Message sent successfully!');
      this.contactForm.reset();
    }
  }

  formatPhoneNumber(event: any) {
    let input = event.target.value.replace(/\D/g, '').substring(0, 10); // Only digits
  
    let formatted = '';
    if (input.length > 6) {
      formatted = `(${input.slice(0, 3)}) ${input.slice(3, 6)}-${input.slice(6)}`;
    } else if (input.length > 3) {
      formatted = `(${input.slice(0, 3)}) ${input.slice(3)}`;
    } else if (input.length > 0) {
      formatted = `(${input}`;
    }
  
    event.target.value = formatted; // updates what user sees
  }

  formatBudget(event: any) {
    let input = event.target.value.replace(/\D/g, '');
    if (!input) return;
  
    const formatted = '$' + parseInt(input, 10).toLocaleString();
    event.target.value = formatted;
  }
  
}
