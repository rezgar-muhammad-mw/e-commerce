import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { API_ROUTES, IApiResponse, ICart } from '@org/shared';
import { CartStore } from '../state/cart.store';

@Injectable({ providedIn: 'root' })
export class CartService {
  private http = inject(HttpClient);
  private cartStore = inject(CartStore);

  loadCart() {
    return this.http
      .get<IApiResponse<ICart>>(API_ROUTES.CART.BASE)
      .pipe(tap((res) => res.data && this.cartStore.setCart(res.data)));
  }

  addItem(productId: number, quantity: number) {
    return this.http
      .post<IApiResponse<ICart>>(API_ROUTES.CART.ADD_ITEM, {
        productId,
        quantity,
      })
      .pipe(tap((res) => res.data && this.cartStore.setCart(res.data)));
  }

  updateItem(itemId: number, quantity: number) {
    return this.http
      .patch<IApiResponse<ICart>>(API_ROUTES.CART.UPDATE_ITEM(itemId), {
        quantity,
      })
      .pipe(tap((res) => res.data && this.cartStore.setCart(res.data)));
  }

  removeItem(itemId: number) {
    return this.http
      .delete<IApiResponse<ICart>>(API_ROUTES.CART.REMOVE_ITEM(itemId))
      .pipe(tap((res) => res.data && this.cartStore.setCart(res.data)));
  }
}
