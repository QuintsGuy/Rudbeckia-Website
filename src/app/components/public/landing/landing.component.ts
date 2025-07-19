import { animate, style, transition, trigger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { RouterLink, RouterModule } from '@angular/router';
import { SupabaseService } from '../../../services/supabase.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterModule],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css',
  animations: [
    trigger('fadeSlide', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(250px)' }),
        animate('800ms ease-out', style({ opacity: 1, transform: 'translatex(0)' }))
      ]),
      transition(':leave', [
        animate('800ms ease-in', style({ opacity: 0, transform: 'translateX(-50px)' }))
      ])
    ])
  ]
})
export class LandingComponent implements OnInit, OnDestroy {
  activeIndex = 0;
  intervalId: any;
  reviews: any[] = [];
  selectedImageUrl: string | null = null;

  constructor(private supabase: SupabaseService) {}

  images = [
    {
      url: 'assets/images/landing/white-hero.jpg',
      title: 'Every Stem Handpicked for Your Special Day',
      subtitle: 'From intimate elopements to grand ballroom weddings, my floral designs are thoughtfully crafted to reflect your unique love story and set the perfect tone for your big day.',
      badge: 'Custom Wedding Florals',
      button: 'Book a Consultation',
      link: '/inquiries'
    },
    {
      url: 'assets/images/landing/IMG_0706.JPG',
      title: 'Curated Floral Services for Every Occasion',
      subtitle: 'Whether you’re planning a wedding, hosting a celebration, or looking for seasonal arrangements, I offer full-service floral design tailored to your vision with elegance, care, and creativity.',
      badge: 'Full-Service Floral Design',
      button: 'View My Services',
      link: '/services'
    },
    {
      url: 'assets/images/landing/IMG_0405.JPG',
      title: 'A Curated Showcase of the Flowers I’ve Loved Creating Most',
      subtitle: 'Take a look through my curated portfolio of vibrant bouquets, lush installations, and delicate details—each design a personal expression of my love for floral artistry.',
      badge: 'My Floral Portfolio',
      button: 'View My Work',
      link: '/portfolio'
    },
    {
      url: 'assets/images/landing/IMG_5897.JPG',
      title: 'Meet Rebecca Barna: The Heart Behind Rudbeckia Florals',
      subtitle: 'With over a decade of experience and an eye for natural elegance, I bring warmth, creativity, and intention to every arrangement. Learn more about my floral journey and what inspires me.',
      badge: 'Behind the Blooms',
      button: 'About Rebecca',
      link: '/about'
    }
  ];

  ngOnInit(): void {
    this.startAutoPlay();
    this.loadTopReviews();
  }

  ngOnDestroy(): void {
    clearInterval(this.intervalId);
  }

  async loadTopReviews() {
    const { data, error } = await this.supabase.getClient()
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3);

    if (error) {
      console.error('Error loading reviews:', error);
      return;
    }

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

  openImageModal(url: string) {
    this.selectedImageUrl = url;
  }

  closeImageModal() {
    this.selectedImageUrl = null;
  }

  startAutoPlay() {
    this.intervalId = setInterval(() => {
      this.next();
    }, 7000); // every 7 seconds
  }

  goToSlide(index: number) {
    this.activeIndex = index;
  }

  next() {
    this.activeIndex = (this.activeIndex + 1) % this.images.length;
  }

  prev() {
    this.activeIndex = (this.activeIndex - 1 + this.images.length) % this.images.length;
  }

  @HostListener('swiperight')
  onSwipeRight() {
    this.prev();
    this.resetAutoplay();
  }

  @HostListener('swipeleft')
  onSwipeLeft() {
    this.next();
    this.resetAutoplay();
  }

  resetAutoplay() {
    clearInterval(this.intervalId);
    this.startAutoPlay();
  }
}
