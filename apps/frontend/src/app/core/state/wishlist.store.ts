import { Injectable, signal, computed } from '@angular/core';
import { IWishlist } from '@org/shared';

@Injectable({ providedIn: 'root' })
export class WishlistStore {
  private _wishlist = signal<IWishlist | null>(null);

  wishlist = this._wishlist.asReadonly();
  itemCount = computed(() => this._wishlist()?.items.length ?? 0);

  isInWishlist(productId: number): boolean {
    const wishlist = this._wishlist();
    return wishlist ? wishlist.items.some((item) => item.productId === productId) : false;
  }

  setWishlist(wishlist: IWishlist) {
    this._wishlist.set(wishlist);
  }

  clearWishlist() {
    this._wishlist.set(null);
  }
}
