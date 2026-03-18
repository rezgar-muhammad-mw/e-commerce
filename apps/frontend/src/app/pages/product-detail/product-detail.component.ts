import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { WishlistService } from '../../core/services/wishlist.service';
import { WishlistStore } from '../../core/state/wishlist.store';
import { AuthStore } from '../../core/state/auth.store';
import { IProduct } from '@org/shared';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [FormsModule, RouterLink, MatButtonModule, MatSelectModule, MatProgressSpinnerModule, MatChipsModule, MatIconModule],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss'],
})
export class ProductDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productService = inject(ProductService);
  private cartService = inject(CartService);
  private wishlistService = inject(WishlistService);
  wishlistStore = inject(WishlistStore);
  private authStore = inject(AuthStore);
  private destroyRef = inject(DestroyRef);

  product = signal<IProduct | null>(null);
  loading = signal(true);
  quantity = 1;
  addingToCart = signal(false);
  addedMsg = signal('');
  qtyOptions = signal<number[]>([]);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.productService
      .getProduct(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (r) => {
          if (r.data) {
            this.product.set(r.data);
            this.qtyOptions.set(
              Array.from({ length: Math.min(r.data.stock, 30) }, (_, i) => i + 1)
            );
          }
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  getWhole(): string {
    return Math.floor(Number(this.product()!.price)).toString();
  }

  getCents(): string {
    const p = Number(this.product()!.price);
    return Math.round((p - Math.floor(p)) * 100)
      .toString()
      .padStart(2, '0');
  }

  toggleWishlist(): void {
    if (!this.authStore.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
    this.wishlistService
      .toggleItem(this.product()!.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  addToCart(): void {
    if (!this.authStore.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
    this.addingToCart.set(true);
    this.cartService
      .addItem(this.product()!.id, +this.quantity)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.addingToCart.set(false);
          this.addedMsg.set('Added to Cart');
          setTimeout(() => this.addedMsg.set(''), 3000);
        },
        error: () => this.addingToCart.set(false),
      });
  }
}
