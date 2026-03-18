import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProductService } from '../../core/services/product.service';
import { CategoryService } from '../../core/services/category.service';
import { IProduct, ICategory, IProductQuery } from '@org/shared';
import { ProductCardComponent } from './product-card.component';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [FormsModule, MatSelectModule, MatButtonModule, MatProgressSpinnerModule, ProductCardComponent],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss'],
})
export class ProductListComponent implements OnInit {
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  products = signal<IProduct[]>([]);
  categories = signal<ICategory[]>([]);
  totalPages = signal(0);
  totalProducts = signal(0);
  loading = signal(false);
  pageNumbers = signal<number[]>([]);

  searchValue = '';
  selectedCategoryId: number | undefined;
  minPrice: number | undefined;
  maxPrice: number | undefined;
  sortOption = 'createdAt-DESC';
  page = signal(1);

  ngOnInit(): void {
    this.categoryService
      .getCategories()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((r) => r.data && this.categories.set(r.data));

    this.route.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((p) => {
        if (p['categoryId']) this.selectedCategoryId = +p['categoryId'];
        if (p['search']) this.searchValue = p['search'];
        this.loadProducts();
      });
  }

  loadProducts(): void {
    this.loading.set(true);
    const [sortBy, sortOrder] = this.sortOption.split('-') as [
      'price' | 'name' | 'createdAt',
      'ASC' | 'DESC',
    ];
    const q: IProductQuery = {
      search: this.searchValue || undefined,
      categoryId: this.selectedCategoryId,
      minPrice: this.minPrice,
      maxPrice: this.maxPrice,
      sortBy,
      sortOrder,
      page: this.page(),
      limit: 20,
    };
    this.productService
      .getProducts(q)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((r) => {
        if (r.data) {
          this.products.set(r.data.data);
          this.totalPages.set(r.data.totalPages);
          this.totalProducts.set(r.data.total);
          this.updatePageNumbers();
        }
        this.loading.set(false);
      });
  }

  onFilterChange(): void {
    this.page.set(1);
    this.loadProducts();
  }

  onSortChange(): void {
    this.page.set(1);
    this.loadProducts();
  }

  setPriceRange(min: number, max: number | undefined): void {
    this.minPrice = min;
    this.maxPrice = max;
    this.onFilterChange();
  }

  hasActiveFilters(): boolean {
    return !!(
      this.selectedCategoryId ||
      this.minPrice !== undefined ||
      this.maxPrice !== undefined ||
      this.searchValue
    );
  }

  getSelectedCategoryName(): string {
    return this.categories().find((c) => c.id === this.selectedCategoryId)?.name || '';
  }

  goToPage(p: number): void {
    if (p >= 1 && p <= this.totalPages()) {
      this.page.set(p);
      this.loadProducts();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  resetFilters(): void {
    this.searchValue = '';
    this.selectedCategoryId = undefined;
    this.minPrice = undefined;
    this.maxPrice = undefined;
    this.sortOption = 'createdAt-DESC';
    this.page.set(1);
    this.loadProducts();
  }

  private updatePageNumbers(): void {
    const t = this.totalPages();
    const c = this.page();
    const s = Math.max(1, c - 2);
    const e = Math.min(t, c + 2);
    const p: number[] = [];
    for (let i = s; i <= e; i++) p.push(i);
    this.pageNumbers.set(p);
  }
}
