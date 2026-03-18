import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { WishlistService } from '../../core/services/wishlist.service';
import { WishlistStore } from '../../core/state/wishlist.store';
import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './wishlist.component.html',
  styleUrls: ['./wishlist.component.scss'],
})
export class WishlistComponent implements OnInit {
  wishlistStore = inject(WishlistStore);
  private wishlistService = inject(WishlistService);
  private cartService = inject(CartService);
  private destroyRef = inject(DestroyRef);

  loading = signal(true);

  ngOnInit(): void {
    this.wishlistService
      .loadWishlist()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.loading.set(false),
        error: () => this.loading.set(false),
      });
  }

  remove(itemId: number): void {
    this.wishlistService
      .removeItem(itemId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  moveToCart(itemId: number, productId: number): void {
    this.cartService
      .addItem(productId, 1)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.wishlistService
            .removeItem(itemId)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe();
        },
      });
  }
}
