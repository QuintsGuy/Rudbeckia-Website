import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-step-coordinator',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './step-coordinator.component.html',
  styleUrl: './step-coordinator.component.css'
})
export class StepCoordinatorComponent {
  @Input() data: any;
  @Input() formGroup!: FormGroup;

  getControl(name: string) {
    return this.formGroup.get(name);
  }
}
