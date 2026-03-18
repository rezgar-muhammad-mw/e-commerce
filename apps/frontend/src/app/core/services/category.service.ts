import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_ROUTES, IApiResponse, ICategory } from '@org/shared';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private http = inject(HttpClient);

  getCategories() {
    return this.http.get<IApiResponse<ICategory[]>>(API_ROUTES.CATEGORIES.BASE);
  }
}
