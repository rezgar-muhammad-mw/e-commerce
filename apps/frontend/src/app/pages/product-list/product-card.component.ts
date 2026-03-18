import { Component, DestroyRef, input, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { IProduct } from '@org/shared';
import { WishlistStore } from '../../core/state/wishlist.store';
import { WishlistService } from '../../core/services/wishlist.service';
import { AuthStore } from '../../core/state/auth.store';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [RouterLink, MatCardModule, MatIconModule],
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.scss'],
})
export class ProductCardComponent {
  product = input.required<IProduct>();

  wishlistStore = inject(WishlistStore);
  private wishlistService = inject(WishlistService);
  private authStore = inject(AuthStore);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  getWhole(): string { return Math.floor(Number(this.product().price)).toString(); }
  getCents(): string {
    const d = Math.round((Number(this.product().price) - Math.floor(Number(this.product().price))) * 100);
    return d.toString().padStart(2, '0');
  }

  toggleWishlist(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (!this.authStore.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
    this.wishlistService
      .toggleItem(this.product().id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }
}
