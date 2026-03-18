import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductDetailComponent } from './product-detail.component';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { AuthStore } from '../../core/state/auth.store';
import { of } from 'rxjs';
import { signal } from '@angular/core';

describe('ProductDetailComponent', () => {
  let component: ProductDetailComponent;
  let fixture: ComponentFixture<ProductDetailComponent>;

  const mockProduct = {
    id: 1,
    name: 'Test Product',
    description: 'A test product',
    price: 29.99,
    stock: 10,
    imageUrl: '',
    categoryId: 1,
    category: { id: 1, name: 'Electronics', slug: 'electronics', description: '' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductDetailComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: { get: () => '1' } },
          },
        },
        {
          provide: ProductService,
          useValue: {
            getProduct: () => of({ success: true, data: mockProduct }),
          },
        },
        {
          provide: CartService,
          useValue: {
            addItem: () => of({ success: true, data: {} }),
          },
        },
        {
          provide: AuthStore,
          useValue: { isAuthenticated: signal(true) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load product on init', () => {
    expect(component.product()).toBeTruthy();
    expect(component.product()!.name).toBe('Test Product');
  });

  it('should calculate whole price', () => {
    expect(component.getWhole()).toBe('29');
  });

  it('should calculate cents', () => {
    expect(component.getCents()).toBe('99');
  });
});
