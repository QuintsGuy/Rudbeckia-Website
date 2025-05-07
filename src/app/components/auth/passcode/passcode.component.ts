import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-passcode',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule ],
  templateUrl: './passcode.component.html',
  styleUrl: './passcode.component.css'
})
export class PasscodeComponent {
  passcodeForm: FormGroup;
  showPasscode: boolean = false;
  loading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private toast: ToastService
  ) {
    this.passcodeForm = this.fb.group({
      passcode: ['', [Validators.required]]
    });
  }

  async onSubmit(): Promise<void> {
    if (this.passcodeForm.invalid) return;

    const { passcode } = this.passcodeForm.value;
    this.loading = true;

    try {
      const success = await this.authService.verifyPasscode(passcode);

      if (success) {
        this.toast.showToast('Passcode verified successfully!', 'success');
      } else {
        this.toast.showToast('Invalid passcode. Please try again.', 'error');
      }
    } catch (err: any) {
      this.toast.showToast('An error occurred while verifying the passcode.', 'error');
    } finally {
      this.loading = false;
    }
  }

  togglePasscodeVisibility(): void {
    this.showPasscode = !this.showPasscode;
  }
}
