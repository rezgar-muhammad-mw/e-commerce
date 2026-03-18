import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CartService } from '../../core/services/cart.service';
import { CartStore } from '../../core/state/cart.store';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, FormsModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss'],
})
export class CartComponent implements OnInit {
  cartStore = inject(CartStore);
  private cartService = inject(CartService);
  private destroyRef = inject(DestroyRef);

  loading = signal(true);
  qtyOptions = Array.from({ length: 30 }, (_, i) => i + 1);

  ngOnInit(): void {
    this.cartService
      .loadCart()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.loading.set(false),
        error: () => this.loading.set(false),
      });
  }

  updateQty(id: number, qty: number): void {
    if (qty >= 1) {
      this.cartService
        .updateItem(id, qty)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe();
    }
  }

  remove(id: number): void {
    this.cartService
      .removeItem(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }
}
