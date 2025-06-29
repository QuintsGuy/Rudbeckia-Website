import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { SupabaseService } from '../../../services/supabase.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-submit-review',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './submit-review.component.html',
  styleUrl: './submit-review.component.css'
})
export class SubmitReviewComponent implements OnInit {
  token!: string;
  reviewForm!: FormGroup;
  reviewData: any;
  loading: boolean = true;
  submitted: boolean = false;
  error: string | null = null;
  imageFiles: File[] = [];
  imagePreviews: string[] = [];
  uploading: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private supabase: SupabaseService,
    private fb: FormBuilder,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    if (!this.token) {
      console.error('Invalid or missing review token.');
      this.toast.showToast('Invalid or missing review token', 'error');
      return;
    }

    this.fetchReview();
  }

  async fetchReview() {
    const { data, error } = await this.supabase.getClient()
      .from('reviews')
      .select('*')
      .eq('token', this.token)
      .single();

    if (error || !data) {
      console.error('Review not found or token is invalid:', error?.message );
      this.toast.showToast('Review not found or token invalid', 'error');
      return;
    }

    const reviewCompleted = data.complete;

    if (reviewCompleted) {
      this.submitted = true;
      this.loading = false;
      return;
    }

    this.reviewData = data;
    this.reviewForm = this.fb.group({
      rating: [null, Validators.required],
      title: ['', Validators.required],
      message: ['', Validators.required]
    });

    this.loading = false;
  }

  async submitReview() {
    if (this.reviewForm.invalid) {
      this.reviewForm.markAllAsTouched();
      return;
    }

    this.uploading = true;
    const imageUrls = await this.uploadImages();

    const { rating, title, message } = this.reviewForm.value;

    const { error: reviewError } = await this.supabase.getClient()
      .from('reviews')
      .update({
        rating,
        title,
        message,
        complete: true
      })
      .eq('review_id', this.reviewData.review_id);

    if (reviewError) {
      console.error('Failed to submit review', reviewError);
      this.toast.showToast('Failed to submit review');
      this.uploading = false;
      return;
    }

    for (let url of imageUrls) {
      const { error: insertError } = await this.supabase.getClient()
        .from('review_images')
        .insert([{ review_id: this.reviewData.review_id, image_url: url }]);

      if (insertError) {
        console.error('Failed to save image URL:', insertError);
      }
    }

    this.uploading = false;
    this.submitted = true;
  }

  onFileChange(event: any) {
    const files: FileList = event.target.files;

    for (let i = 0; i < files.length; i++) {
      const file = files.item(i);
      if (file && ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        this.imageFiles.push(file);

        const reader = new FileReader();
        reader.onload = (e: any) => this.imagePreviews.push(e.target.result);
        reader.readAsDataURL(file);
      }
    }
  }

  removeImage(index: number) {
    this.imageFiles.splice(index, 1);
    this.imagePreviews.splice(index, 1);
  }

  async uploadImages(): Promise<string[]> {
    const uploadedUrls: string[] = [];

    for (let file of this.imageFiles) {      
      const filePath = `review-${this.reviewData.review_id}/${file.name}`;
      const { error: uploadError } = await this.supabase.getClient()
        .storage.from('review-images')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Image upload failed:', uploadError);
        continue;
      }

      const { data: urlData } = this.supabase.getClient()
        .storage.from('review-images')
        .getPublicUrl(filePath);

      uploadedUrls.push(urlData.publicUrl);
    }

    return uploadedUrls;
  }
}
