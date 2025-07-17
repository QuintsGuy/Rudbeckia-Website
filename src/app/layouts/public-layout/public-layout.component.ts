import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../../components/shared/navbar/navbar.component';
import { CommonModule } from '@angular/common';
import { FooterComponent } from '../../components/shared/footer/footer.component';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent, FooterComponent],
  templateUrl: './public-layout.component.html',
  styleUrl: './public-layout.component.css'
})
export class PublicLayoutComponent {
  isMenuOpen = false;

  @ViewChild('menuWrapper') menuWrapper!: ElementRef;
  @ViewChild(NavbarComponent) navbar!: NavbarComponent;

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const clickedInside = this.menuWrapper?.nativeElement.contains(event.target);
    if (!clickedInside && this.isMenuOpen) {
      this.isMenuOpen = false;
    }
  }
}
