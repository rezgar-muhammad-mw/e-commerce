import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { ProductService } from '../../core/services/product.service';
import { CategoryService } from '../../core/services/category.service';
import { IProduct, ICategory } from '@org/shared';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, MatCardModule, MatButtonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private destroyRef = inject(DestroyRef);

  categories = signal<ICategory[]>([]);
  featured = signal<IProduct[]>([]);

  ngOnInit(): void {
    this.categoryService
      .getCategories()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((r) => r.data && this.categories.set(r.data));

    this.productService
      .getProducts({ limit: 8, sortBy: 'createdAt', sortOrder: 'DESC' })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((r) => r.data && this.featured.set(r.data.data));
  }
}
