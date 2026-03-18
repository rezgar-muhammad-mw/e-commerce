import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
  API_ROUTES,
  IApiResponse,
  IPaginatedResponse,
  IProduct,
  IProductQuery,
} from '@org/shared';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private http = inject(HttpClient);

  getProducts(query: IProductQuery) {
    let params = new HttpParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });
    return this.http.get<IApiResponse<IPaginatedResponse<IProduct>>>(
      API_ROUTES.PRODUCTS.BASE,
      { params },
    );
  }

  getProduct(id: number) {
    return this.http.get<IApiResponse<IProduct>>(API_ROUTES.PRODUCTS.BY_ID(id));
  }
}
