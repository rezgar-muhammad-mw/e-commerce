import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductCardComponent } from './product-card.component';
import { provideRouter } from '@angular/router';
import { ComponentRef } from '@angular/core';

describe('ProductCardComponent', () => {
  let component: ProductCardComponent;
  let componentRef: ComponentRef<ProductCardComponent>;
  let fixture: ComponentFixture<ProductCardComponent>;

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
      imports: [ProductCardComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductCardComponent);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;
    componentRef.setInput('product', mockProduct);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should return whole part of price', () => {
    expect(component.getWhole()).toBe('29');
  });

  it('should return cents part of price', () => {
    expect(component.getCents()).toBe('99');
  });
});
