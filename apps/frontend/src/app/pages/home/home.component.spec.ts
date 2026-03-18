import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HomeComponent } from './home.component';
import { provideRouter } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { CategoryService } from '../../core/services/category.service';
import { of } from 'rxjs';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        provideRouter([]),
        {
          provide: ProductService,
          useValue: {
            getProducts: () => of({ success: true, data: { data: [], total: 0, totalPages: 0 } }),
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

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty categories', () => {
    expect(component.categories()).toEqual([]);
  });

  it('should initialize with empty featured products', () => {
    expect(component.featured()).toEqual([]);
  });
});
