import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-passcode',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule ],
  templateUrl: './passcode.component.html',
  styleUrl: './passcode.component.css'
})
export class PasscodeComponent {
  passcodeForm: FormGroup;
  passcodeError: string | null = null;
  showPasscode: boolean = false;
  loading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.passcodeForm = this.fb.group({
      passcode: ['', [Validators.required]]
    });
  }

  async onSubmit(): Promise<void> {
    if (this.passcodeForm.invalid) return;
    const { passcode } = this.passcodeForm.value;
    this.loading = true;

    await this.authService.verifyPasscode(passcode);

    this.loading = false;
  }

  togglePasscodeVisibility(): void {
    this.showPasscode = !this.showPasscode;
  }
}
