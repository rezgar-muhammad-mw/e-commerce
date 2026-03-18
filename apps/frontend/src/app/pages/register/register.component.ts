import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink, MatFormFieldModule, MatInputModule, MatButtonModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  firstName = '';
  lastName = '';
  email = '';
  password = '';
  error = signal('');
  submitting = signal(false);

  onSubmit(): void {
    this.error.set('');
    this.submitting.set(true);
    this.authService
      .register({
        email: this.email,
        password: this.password,
        firstName: this.firstName,
        lastName: this.lastName,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.router.navigate(['/']);
        },
        error: (e) => {
          this.submitting.set(false);
          this.error.set(e.error?.message || 'Registration failed.');
        },
      });
  }
}
