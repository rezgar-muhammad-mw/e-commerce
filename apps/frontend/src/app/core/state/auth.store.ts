import { Injectable, signal, computed } from '@angular/core';
import { IUser } from '@org/shared';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private _token = signal<string | null>(
    typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null,
  );
  private _user = signal<IUser | null>(null);

  token = this._token.asReadonly();
  user = this._user.asReadonly();
  isAuthenticated = computed(() => !!this._token());

  setAuth(token: string, user: IUser) {
    localStorage.setItem('token', token);
    this._token.set(token);
    this._user.set(user);
  }

  clearAuth() {
    localStorage.removeItem('token');
    this._token.set(null);
    this._user.set(null);
  }
}
