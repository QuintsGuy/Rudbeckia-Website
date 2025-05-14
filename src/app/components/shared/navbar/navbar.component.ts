import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, Output, ViewChild } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs';
import { animate, animateChild, group, query, stagger, state, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
  animations: [
    trigger('menuSlideFade', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        group([
          animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
          query('@menuItem', stagger(100, animateChild()), { optional: true })
        ])
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'translateY(-10px)' }))
      ])
    ]),
    trigger('menuContentFadeSlide', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('300ms 100ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('menuItem', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-5px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})

export class NavbarComponent {
  @Output() menuToggled = new EventEmitter<boolean>();
  hideLoginButton = false;
  isMenuOpen= false;
  private hiddenRoutes = [
    '/auth/passcode', 
    '/terms-and-conditions', 
    '/view/proposal', 
    '/auth/login', 
    '/contact', 
    '/view/payments', 
    '/view/payment-success', 
    '/view/payment-cancel'
  ];
  
  constructor(private router: Router) {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.hideLoginButton = this.hiddenRoutes.includes(event.urlAfterRedirects);
      });
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
    this.menuToggled.emit(this.isMenuOpen);
  }

  collapseMenu() {
    this.isMenuOpen = false;
    this.menuToggled.emit(false);
  }
}
