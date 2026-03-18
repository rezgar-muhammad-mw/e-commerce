import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegisterComponent } from './register.component';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { of, throwError } from 'rxjs';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let authService: { register: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    const authSpy = {
      register: vi.fn().mockReturnValue(of({ success: true, data: { accessToken: 'token' } })),
    };

    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as unknown as typeof authService;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty fields', () => {
    expect(component.firstName).toBe('');
    expect(component.lastName).toBe('');
    expect(component.email).toBe('');
    expect(component.password).toBe('');
  });

  it('should set error on failed registration', () => {
    authService.register.mockReturnValue(
      throwError(() => ({ error: { message: 'Email already exists.' } }))
    );
    component.email = 'test@test.com';
    component.password = '123456';
    component.firstName = 'Test';
    component.lastName = 'User';
    component.onSubmit();
    expect(component.error()).toBe('Email already exists.');
  });
});
