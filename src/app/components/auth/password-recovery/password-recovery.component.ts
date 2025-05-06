import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SupabaseService } from '../../../services/supabase.service';
import { RouterModule } from '@angular/router';

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
  successMessage: string | null = null;
  errorMessage: string | null = null;

  constructor(private fb: FormBuilder, private supabaseService: SupabaseService) {
    this.recoveryForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]] 
    });
  }

  async onSubmit() {
    if (this.recoveryForm.invalid) return;

    this.loading = true;
    this.successMessage = null;
    this.errorMessage = null;

    const email = this.recoveryForm.get('email')?.value;

    try {
      const { error } = await this.supabaseService.getClient().auth.resetPasswordForEmail(email);

      if (error) {
        this.errorMessage = error.message;
      } else {
        this.successMessage = 'Reset link sent! Please check your email.';
      }
    } catch (err: any) {
      this.errorMessage = 'Something went wrong. Please try again.';
    } finally {
      this.loading = false;
    }
  }
}
