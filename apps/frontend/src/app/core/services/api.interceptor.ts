import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthStore } from '../state/auth.store';

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  const authStore = inject(AuthStore);
  const token = authStore.token();

  let modifiedReq = req;

  if (token) {
    modifiedReq = modifiedReq.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  if (!modifiedReq.url.startsWith('http')) {
    modifiedReq = modifiedReq.clone({
      url: `http://localhost:3000${modifiedReq.url}`,
    });
  }

  return next(modifiedReq);
};
