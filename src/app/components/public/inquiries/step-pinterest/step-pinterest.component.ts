import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-step-pinterest',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './step-pinterest.component.html',
  styleUrl: './step-pinterest.component.css'
})
export class StepPinterestComponent implements OnInit, OnDestroy {
  @Input() data: { urls: string[]; images: File[] } = { urls: [''], images: [] };
  previewUrls: string[] = [];

  ngOnInit() {
    if (!this.data.urls || this.data.urls.length === 0) {
      this.data.urls = [''];
    }
  }

  ngOnDestroy(): void {
    this.previewUrls.forEach(url => URL.revokeObjectURL(url));
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
      const newFiles = Array.from(files);
      this.data.images.push(...newFiles);
      this.previewUrls.push(...newFiles.map(file => URL.createObjectURL(file)));
    }
  }

  removeImage(index: number) {
    URL.revokeObjectURL(this.previewUrls[index]);
    this.data.images.splice(index, 1);
    this.previewUrls.splice(index, 1);
  }
}
