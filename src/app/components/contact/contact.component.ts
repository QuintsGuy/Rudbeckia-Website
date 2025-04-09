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
      venue: [''],
      budget: ['', Validators.required],
      coordinator: [''],
      pinterest: [''],
      message: ['', Validators.required]
    });
  }

  async onSubmit() {
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }

    const formValue = this.contactForm.value;
    const fullName = `${formValue.firstName} ${formValue.lastName}`;

    const { error } = await this.supabaseService.getClient()
      .from('consult_msg')
      .insert([{
        name: fullName,
        email: formValue.email,
        phone: formValue.phone,
        eventDate: formValue.eventDate,
        venue: formValue.venue,
        budget: formValue.budget,
        coordinator: formValue.coordinator,
        pinterest: formValue.pinterest,
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
}
