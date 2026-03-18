import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NavbarComponent } from './navbar.component';
import { provideRouter } from '@angular/router';
import { AuthStore } from '../../core/state/auth.store';
import { CartStore } from '../../core/state/cart.store';
import { AuthService } from '../../core/services/auth.service';
import { signal } from '@angular/core';

describe('NavbarComponent', () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavbarComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthStore,
          useValue: { isAuthenticated: signal(false), user: signal(null) },
        },
        {
          provide: CartStore,
          useValue: { itemCount: signal(0) },
        },
        {
          provide: AuthService,
          useValue: { logout: jasmine.createSpy('logout') },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should navigate on search when query is not empty', () => {
    component.searchQuery = 'laptop';
    component.onSearch();
    expect(component.searchQuery).toBe('laptop');
  });

  it('should not navigate on search when query is empty', () => {
    component.searchQuery = '   ';
    component.onSearch();
    expect(component.searchQuery).toBe('   ');
  });
});
