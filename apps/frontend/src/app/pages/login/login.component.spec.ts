import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { of, throwError } from 'rxjs';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: { login: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    const authSpy = {
      login: vi.fn().mockReturnValue(of({ success: true, data: { accessToken: 'token' } })),
    };

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as unknown as typeof authService;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty credentials', () => {
    expect(component.email).toBe('');
    expect(component.password).toBe('');
  });

  it('should set error on failed login', () => {
    authService.login.mockReturnValue(
      throwError(() => ({ error: { message: 'Invalid credentials.' } }))
    );
    component.email = 'test@test.com';
    component.password = 'wrong';
    component.onSubmit();
    expect(component.error()).toBe('Invalid credentials.');
  });
});
