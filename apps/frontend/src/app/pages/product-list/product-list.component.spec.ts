import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductListComponent } from './product-list.component';
import { provideRouter } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { CategoryService } from '../../core/services/category.service';
import { of } from 'rxjs';

describe('ProductListComponent', () => {
  let component: ProductListComponent;
  let fixture: ComponentFixture<ProductListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductListComponent],
      providers: [
        provideRouter([]),
        {
          provide: ProductService,
          useValue: {
            getProducts: () =>
              of({ success: true, data: { data: [], total: 0, totalPages: 0 } }),
          },
        },
        {
          provide: CategoryService,
          useValue: {
            getCategories: () => of({ success: true, data: [] }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty products', () => {
    expect(component.products()).toEqual([]);
  });

  it('should detect active filters', () => {
    expect(component.hasActiveFilters()).toBeFalse();
    component.selectedCategoryId = 1;
    expect(component.hasActiveFilters()).toBeTrue();
  });

  it('should reset all filters', () => {
    component.searchValue = 'test';
    component.selectedCategoryId = 1;
    component.minPrice = 10;
    component.maxPrice = 100;
    component.resetFilters();
    expect(component.searchValue).toBe('');
    expect(component.selectedCategoryId).toBeUndefined();
    expect(component.minPrice).toBeUndefined();
    expect(component.maxPrice).toBeUndefined();
  });
});
