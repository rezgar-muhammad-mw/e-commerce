import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { of, throwError } from 'rxjs';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    const authSpy = jasmine.createSpyObj('AuthService', ['login']);
    authSpy.login.and.returnValue(of({ success: true, data: { accessToken: 'token' } }));

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty credentials', () => {
    expect(component.email).toBe('');
    expect(component.password).toBe('');
  });

  it('should set error on failed login', () => {
    authService.login.and.returnValue(
      throwError(() => ({ error: { message: 'Invalid credentials.' } }))
    );
    component.email = 'test@test.com';
    component.password = 'wrong';
    component.onSubmit();
    expect(component.error()).toBe('Invalid credentials.');
  });
});
