import { Component, OnInit } from '@angular/core';
import confetti from 'canvas-confetti';

@Component({
  selector: 'app-success',
  imports: [],
  templateUrl: './success.component.html',
  styleUrl: './success.component.css'
})
export class SuccessComponent implements OnInit {
  ngOnInit(): void {
      this.launchConfetti();
    }
  
    launchConfetti() {
      const duration = 2 * 1000;
      const end = Date.now() + duration;
  
      const interval = setInterval(() => {
        if (Date.now() > end) {
          clearInterval(interval);
          return;
        }
  
        confetti({
          startVelocity: 25,
          spread: 360,
          ticks: 60,
          zIndex: 1000,
          particleCount: 80,
          origin: {
            x: Math.random(),
            y: Math.random() - 0.2
          }
        });
      }, 250);
    }
}
