import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { SupabaseService } from '../../../services/supabase.service';

@Component({
  selector: 'app-reviews',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reviews.component.html',
  styleUrl: './reviews.component.css'
})
export class ReviewsComponent implements OnInit {
  reviews: any[] = [];
  loading: boolean = true;
  selectedImageUrl: string | null = null;

  constructor(private supabase: SupabaseService) {}

  async ngOnInit(): Promise<void> {
    const { data, error } = await this.supabase.getClient()
      .from('reviews')
      .select('*');
    
    if (error) {
      console.error('Failed to load public reviews:', error);
    } else {
      const reviewsWithImages = await Promise.all(
        (data || []).map(async review => {
          const { data: images } = await this.supabase.getClient()
            .from('review_images')
            .select('image_url')
            .eq('review_id', review.review_id)
            .eq('is_shown', true);
          
          const publicImages = (images || []).map(img => {
            const parts = img.image_url.split('/review-images/');
            const path = parts[1];

            const { data } = this.supabase.getClient().storage
              .from('review-images')
              .getPublicUrl(path);
            return data.publicUrl;
          });
          
          return { ...review, images: publicImages || [] };
        })
      );

      this.reviews = reviewsWithImages;
    }

    this.loading = false;
  }

  openImageModal(url: string) {
    this.selectedImageUrl = url;
  }

  closeImageModal() {
    this.selectedImageUrl = null;
  }
}
