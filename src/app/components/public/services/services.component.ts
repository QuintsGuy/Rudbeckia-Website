import { animate, style, transition, trigger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [CommonModule, ],
  templateUrl: './services.component.html',
  styleUrl: './services.component.css',
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('700ms ease-in', style({ opacity: 1 }))
      ])
    ])
  ]
})
export class ServicesComponent {
  tabs = ['Weddings', 'Parties', 'Graduations', 'Funerals', 'Other'];
  selectedTab = 'Weddings';

  selectTab(tab: string) {
    this.selectedTab = tab
  }
}


