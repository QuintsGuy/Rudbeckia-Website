import { Component } from '@angular/core';
import { SupabaseService } from '../../../services/supabase.service';
import { ToastService } from '../../../services/toast.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StepClientComponent } from "./step-client/step-client.component";
import { StepEventComponent } from "./step-event/step-event.component";
import { StepCoordinatorComponent } from "./step-coordinator/step-coordinator.component";
import { StepPinterestComponent } from "./step-pinterest/step-pinterest.component";

@Component({
  selector: 'app-inquiries',
  standalone: true,
  imports: [CommonModule, FormsModule, StepClientComponent, StepEventComponent, StepCoordinatorComponent, StepPinterestComponent],
  templateUrl: './inquiries.component.html',
  styleUrl: './inquiries.component.css'
})
export class InquiriesComponent {
  constructor(private supabase: SupabaseService, private toast: ToastService) {}
  
  step = 1;

  formData = {
    client: {
      first_name: '', last_name: '', email: '', phone: '',
      address: '', city: '', state: '', zipcode: '', preferred_contact: ''
    },
    event: {
      date: '', type: '', venue: '', address: '', city: '', state: '', zipcode: '',
      budget: '', message: ''
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
      // 1. Insert client & coordinator & event (relational logic based on schema)
      const { data: event, error } = await this.supabase.getClient()
        .from('events')
        .insert({
          ...this.formData.event,
          client: this.formData.client,
          coordinator: this.formData.coordinator
        })
        .select()
        .single();

      // 2. Upload any image files from Pinterest
      for (const file of this.formData.pinterest.images) {
        await this.supabase.getClient().storage
          .from('pinterest-inspo')
          .upload(`${event.id}/${file.name}`, file);
      }

      this.toast.showToast('Inquiry submitted successfully!', 'success');
    } catch (err) {
      this.toast.showToast('There was a problem submitting the form.', 'error');
    }
  };
}
