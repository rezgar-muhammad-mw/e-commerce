import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { API_ROUTES, IApiResponse, IWishlist } from '@org/shared';
import { WishlistStore } from '../state/wishlist.store';

@Injectable({ providedIn: 'root' })
export class WishlistService {
  private http = inject(HttpClient);
  private wishlistStore = inject(WishlistStore);

  loadWishlist() {
    return this.http
      .get<IApiResponse<IWishlist>>(API_ROUTES.WISHLIST.BASE)
      .pipe(tap((res) => res.data && this.wishlistStore.setWishlist(res.data)));
  }

  addItem(productId: number) {
    return this.http
      .post<IApiResponse<IWishlist>>(API_ROUTES.WISHLIST.ITEMS, { productId })
      .pipe(tap((res) => res.data && this.wishlistStore.setWishlist(res.data)));
  }

  removeItem(itemId: number) {
    return this.http
      .delete<IApiResponse<IWishlist>>(API_ROUTES.WISHLIST.ITEM(itemId))
      .pipe(tap((res) => res.data && this.wishlistStore.setWishlist(res.data)));
  }

  toggleItem(productId: number) {
    const wishlist = this.wishlistStore.wishlist();
    if (wishlist) {
      const existing = wishlist.items.find((item) => item.productId === productId);
      if (existing) {
        return this.removeItem(existing.id);
      }
    }
    return this.addItem(productId);
  }
}
