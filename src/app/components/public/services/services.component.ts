import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { BrowserAnimationsModule, provideAnimations } from '@angular/platform-browser/animations';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './services.component.html',
  styleUrl: './services.component.css'
})
export class ServicesComponent {
  tabs = ['Weddings', 'Parties', 'Graduations', 'Funerals', 'Other'];
  selectedTab = 'Weddings';

  selectTab(tab: string) {
    this.selectedTab = tab
  }
}


