import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { API_ROUTES, IApiResponse, IAuthResponse } from '@org/shared';
import { AuthStore } from '../state/auth.store';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private authStore = inject(AuthStore);

  login(email: string, password: string) {
    return this.http
      .post<IApiResponse<IAuthResponse>>(API_ROUTES.AUTH.LOGIN, {
        email,
        password,
      })
      .pipe(
        tap((res) => {
          if (res.data) {
            this.authStore.setAuth(res.data.accessToken, res.data.user);
          }
        }),
      );
  }

  register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) {
    return this.http
      .post<IApiResponse<IAuthResponse>>(API_ROUTES.AUTH.REGISTER, data)
      .pipe(
        tap((res) => {
          if (res.data) {
            this.authStore.setAuth(res.data.accessToken, res.data.user);
          }
        }),
      );
  }

  logout() {
    this.authStore.clearAuth();
  }

  getProfile() {
    return this.http.get<IApiResponse<any>>(API_ROUTES.AUTH.PROFILE);
  }
}
