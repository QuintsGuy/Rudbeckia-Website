import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-step-coordinator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './step-coordinator.component.html',
  styleUrl: './step-coordinator.component.css'
})
export class StepCoordinatorComponent {
  @Input() data: any;
}
