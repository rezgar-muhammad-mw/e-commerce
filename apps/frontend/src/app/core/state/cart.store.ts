import { Injectable, signal, computed } from '@angular/core';
import { ICart } from '@org/shared';

@Injectable({ providedIn: 'root' })
export class CartStore {
  private _cart = signal<ICart | null>(null);

  cart = this._cart.asReadonly();
  itemCount = computed(() => {
    const cart = this._cart();
    return cart ? cart.items.reduce((sum, item) => sum + item.quantity, 0) : 0;
  });
  totalPrice = computed(() => this._cart()?.totalPrice ?? 0);

  setCart(cart: ICart) {
    this._cart.set(cart);
  }

  clearCart() {
    this._cart.set(null);
  }
}
