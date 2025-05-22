import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-step-pinterest',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './step-pinterest.component.html',
  styleUrl: './step-pinterest.component.css'
})
export class StepPinterestComponent implements OnInit {
  @Input() data: { urls: string[]; images: File[] } = { urls: [''], images: [] };

  ngOnInit() {
    if (!this.data.urls || this.data.urls.length === 0) {
      this.data.urls = [''];
    }
  }

  get url() {
    return URL;
  }

  addPinterestUrl() {
    this.data.urls.push('');
  }

  removePinterestUrl(index: number) {
    this.data.urls.splice(index, 1);
  }

  handleFileInput(event: Event) {
    const files = (event.target as HTMLInputElement)?.files;
    if (files) {
      this.data.images.push(...Array.from(files));
    }
  }

  removeImage(index: number) {
    this.data.images.splice(index, 1);
  }
}
