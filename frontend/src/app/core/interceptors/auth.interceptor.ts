import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, from, Observable, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';

const shouldSkipAuth = (request: HttpRequest<unknown>): boolean => {
  const authBypassPaths = [
    '/auth/refresh',
    '/auth/otp/send',
    '/auth/otp/verify',
    '/auth/google',
  ];

  return authBypassPaths.some((path) => request.url.includes(path));
};

const attachBearerToken = (
  request: HttpRequest<unknown>,
  accessToken: string | null
): HttpRequest<unknown> => {
  if (!accessToken) {
    return request;
  }

  return request.clone({
    setHeaders: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
};

const handleUnauthorized = (
  request: HttpRequest<unknown>,
  next: HttpHandlerFn,
  error: HttpErrorResponse,
  authService: AuthService,
  router: Router
): Observable<HttpEvent<unknown>> => {
  if (error.status !== 401 || shouldSkipAuth(request) || !authService.currentRefreshToken()) {
    if (error.status === 401 && !shouldSkipAuth(request)) {
      void authService.clearSession();
      void router.navigateByUrl('/auth', { replaceUrl: true });
    }
    return throwError(() => error);
  }

  return from(authService.refreshSession()).pipe(
    switchMap((refreshed) => {
      const nextToken = authService.currentAccessToken();

      if (!refreshed || !nextToken) {
        void authService.clearSession();
        void router.navigateByUrl('/auth', { replaceUrl: true });
        return throwError(() => error);
      }

      return next(attachBearerToken(request, nextToken));
    }),
    catchError((refreshError) => {
      void authService.clearSession();
      void router.navigateByUrl('/auth', { replaceUrl: true });
      return throwError(() => refreshError);
    })
  );
};

export const authInterceptor: HttpInterceptorFn = (
  request: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const isApiRequest = request.url.startsWith(environment.apiBaseUrl);
  if (!isApiRequest) {
    return next(request);
  }

  const requestWithAuth = shouldSkipAuth(request)
    ? request
    : attachBearerToken(request, authService.currentAccessToken());

  return next(requestWithAuth).pipe(
    catchError((error: HttpErrorResponse) =>
      handleUnauthorized(request, next, error, authService, router)
    )
  );
};
