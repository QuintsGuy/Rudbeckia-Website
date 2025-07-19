import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { RouterModule} from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  loginForm: FormGroup;
  loginError: string | null = null;
  showPassword: boolean = false;
  loading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      remember: [false]
    });
  }

  async onSubmit(): Promise<void> {
    if (this.loginForm.invalid) {
      console.warn('Login form is invalid');
      return;
    }

    const { email, password } = this.loginForm.value;
    this.loading = true;
    this.loginError = null;

    try {
      const error = await this.authService.login(email, password);

      if (error) {
        this.loginError = error;
        console.warn('⚠️ Login failed:', error);
        alert(error);
      } else {
        console.log('✅ Login successful');
      }
    } catch (err) {
      this.loginError = 'An unexpected error occurred.';
      console.error('🔥 Login error:', err);
    }

    this.loading = false;
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
}
