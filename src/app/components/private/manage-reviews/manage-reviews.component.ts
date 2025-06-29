import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { SupabaseService } from '../../../services/supabase.service';
import { Router } from '@angular/router';
import { ToastService } from '../../../services/toast.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-manage-reviews',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './manage-reviews.component.html',
  styleUrl: './manage-reviews.component.css'
})
export class ManageReviewsComponent {
  reviews: any[] = [];
  targetReview: any = null;
  selectedReviews: any = null;
  reviewImages: { review_images_id: string, image_url: string, is_shown: boolean }[] = [];
  editReviewForm!: FormGroup;
  showModal: boolean = false;
  loading: boolean = true;
  actionLoading: boolean = false;
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  user: any;
  currentPage: number = 1;
  pageSize: number = 10;
  totalRecords: number = 0;

  constructor(
    private supabase: SupabaseService,
    private router: Router,
    private toast: ToastService,
    private fb: FormBuilder
  ) {}

  async ngOnInit(): Promise<void> {
    const session = await this.supabase.getClient().auth.getSession();
    this.user = session.data.session?.user;

    if(!this.user) {
      this.router.navigate(['/']);
      return;
    }

    await this.fetchReviews();
  }

  async fetchReviews() {
    this.loading = true;
    
    const from = (this.currentPage - 1) * this.pageSize;
    const to = from + this.pageSize - 1;

    const { data: reviewsData, count, error: fetchError } = await this.supabase.getClient()
      .from('reviews')
      .select(`*, event:events (*, client:clients (*))`)
      .order('view_order', {ascending: true})
      .range(from, to);
    
    console.log(reviewsData);
    
    if (fetchError) {
      console.error('Failed to load reviews: ', fetchError.message);
      this.toast.showToast('Failed to load reviews', 'error');
    } else {
      this.reviews = reviewsData?.map(review => ({
        ...review,
        isExpanded: false,
      })) || [];
      this.totalRecords = count || 0;
    }
    this.loading = false;
  }

  nextPage() {
    if ((this.currentPage * this.pageSize) < this.totalRecords) {
      this.currentPage++;
      this.fetchReviews();
    }
  }
  
  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.fetchReviews();
    }
  }

  setSort(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    this.sortReviews();
  }

  sortReviews() {
    this.reviews.sort((a, b) => {
      const aVal = this.getSortValue(a, this.sortColumn);
      const bVal = this.getSortValue(b, this.sortColumn);

      if (aVal < bVal) return this.sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  getSortValue(item: any, column: string): any {
    switch (column) {
      case 'view_order': return item.view_order ?? 0;
      case 'rating': return item.rating ?? 0;
      case 'complete': return item.complete ? 1 : 0;
      case 'is_shown': return item.is_shown ? 1 : 0;
      default: return '';
    }
  }

  async toggleModal(review: any) {
    this.selectedReviews = review;
    this.showModal = true;

    this.editReviewForm = this.fb.group({
      title: [review.title || '', Validators.required],
      message: [review.message || '', Validators.required],
      rating: [review.rating || null, Validators.required],
      view_order: [review.view_order || 0],
      is_shown: [review.is_shown || false],
    });

    this.fetchReviewImages(review.review_id);
  }

  async fetchReviewImages(reviewId: string) {
    const { data, error } = await this.supabase.getClient()
      .from('review_images')
      .select('review_images_id, image_url, is_shown')
      .eq('review_id', reviewId);

    this.reviewImages = data || [];
  }

  async submitReviewUpdate() {
    if (this.editReviewForm.invalid) {
      this.editReviewForm.markAllAsTouched();
      return;
    }

    this.actionLoading = true;

    const { title, message, rating, view_order, is_shown } = this.editReviewForm.value;

    const { error: reorderError } = await this.supabase.getClient()
      .rpc('reorder_review', {
        target_review_id: this.selectedReviews.review_id,
        new_position: view_order === '' ? null : view_order
      });

    if (reorderError) {
      console.error('Failed to reorder view_order:', reorderError);
      this.toast.showToast('View order update failed', 'error');
      this.actionLoading = false;
      return;
    }
    
    const { error: updateError } = await this.supabase.getClient()
      .from('reviews')
      .update({
        title,
        message,
        rating,
        is_shown
      })
      .eq('review_id', this.selectedReviews.review_id);

    if (updateError) {
      console.error('Failed to update review:', updateError);
      this.toast.showToast('Failed to updated review', 'error');
    } else {
      this.showModal = false;
      await this.fetchReviews();
    }

    this.actionLoading = false;
  }

  async toggleImageVisibility(imageId: string, newState: boolean) {
    const { error } = await this.supabase.getClient()
      .from('review_images')
      .update({ is_shown: newState })
      .eq('review_images_id', imageId);

    if (error) {
      console.error('Failed to update image visibility:', error);
    } else {
      this.reviewImages = this.reviewImages.map(img =>
        img.review_images_id === imageId ? { ...img, is_shown: newState } : img
      );
    }
  }
}
