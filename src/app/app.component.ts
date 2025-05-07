import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';
import { ToastComponent } from './components/shared/toast/toast.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit{
  title = 'Rudbeckia-Website';
  
  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.init();
  }
}
