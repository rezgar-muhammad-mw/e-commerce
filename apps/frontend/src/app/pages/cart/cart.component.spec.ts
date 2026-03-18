import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CartComponent } from './cart.component';
import { provideRouter } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { CartStore } from '../../core/state/cart.store';
import { of } from 'rxjs';
import { signal } from '@angular/core';

describe('CartComponent', () => {
  let component: CartComponent;
  let fixture: ComponentFixture<CartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CartComponent],
      providers: [
        provideRouter([]),
        {
          provide: CartService,
          useValue: {
            loadCart: () => of({ success: true, data: { items: [] } }),
            updateItem: () => of({ success: true }),
            removeItem: () => of({ success: true }),
          },
        },
        {
          provide: CartStore,
          useValue: {
            cart: signal(null),
            itemCount: signal(0),
            totalPrice: signal(0),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have 30 quantity options', () => {
    expect(component.qtyOptions.length).toBe(30);
  });
});
