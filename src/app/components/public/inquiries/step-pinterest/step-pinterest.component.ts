import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-step-pinterest',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './step-pinterest.component.html',
  styleUrl: './step-pinterest.component.css'
})
export class StepPinterestComponent implements OnInit, OnDestroy {
  @Input() formGroup!: FormGroup;
  previewUrls: string[] = [];

  ngOnInit() {
    const urls = this.formGroup.get('urls')?.value;
    if (!urls || urls.length === 0) {
      this.formGroup.patchValue({ urls: [''] });
    }
  }

  ngOnDestroy(): void {
    this.previewUrls.forEach(url => URL.revokeObjectURL(url));
  }

  get url() {
    return URL;
  }

  addPinterestUrl() {
    const urls = this.formGroup.get('urls')?.value || [];
    urls.push('');
    this.formGroup.patchValue({ urls });
  }

  removePinterestUrl(index: number) {
    const urls = this.formGroup.get('urls')?.value || [];
    urls.splice(index, 1);
    this.formGroup.patchValue({ urls });
  }

  handleFileInput(event: Event) {
    const files = (event.target as HTMLInputElement)?.files;
    if (files) {
      const newFiles = Array.from(files);
      const currentImages = this.formGroup.get('images')?.value || [];
      this.formGroup.patchValue({
        images: [...currentImages, ...newFiles]
      });
      this.previewUrls.push(...newFiles.map(file => URL.createObjectURL(file)));
    }
  }

  removeImage(index: number) {
    const currentImages = this.formGroup.get('images')?.value || [];
    currentImages.splice(index, 1);
    this.formGroup.patchValue({ images: currentImages });
    
    URL.revokeObjectURL(this.previewUrls[index]);
    this.previewUrls.splice(index, 1);
  }
}
