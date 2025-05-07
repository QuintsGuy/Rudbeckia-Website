import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SupabaseService } from '../../../services/supabase.service';
import { RouterModule } from '@angular/router';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-password-recovery',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './password-recovery.component.html',
  styleUrl: './password-recovery.component.css'
})
export class PasswordRecoveryComponent { 
  recoveryForm: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder, 
    private supabaseService: SupabaseService, 
    private toast: ToastService
  ) {
    this.recoveryForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]] 
    });
  }

  async onSubmit() {
    if (this.recoveryForm.invalid) return;

    this.loading = true;

    const email = this.recoveryForm.get('email')?.value;

    try {
      const { error } = await this.supabaseService.getClient().auth.resetPasswordForEmail(email);

      if (error) {
        this.toast.showToast(`Failed to send reset link: ${error.message}`, 'error');
      } else {
        this.toast.showToast('Password reset email sent. Please check your inbox!', 'success');
      }
    } catch (err: any) {
      this.toast.showToast('Something went wrong. Please try again.', 'error');
    } finally {
      this.loading = false;
    }
  }
}
