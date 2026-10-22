import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const token = authService.getToken();

    const requestToForward = token
        ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
        : req;

    return next(requestToForward).pipe(
        catchError((error: HttpErrorResponse) => {
            // When token is expired, invalid, or unauthorized, clear stale credentials and redirect to login
            if (error.status === 401 || (error.status === 403 && !req.url.includes('/auth/login'))) {
                authService.logout();
                router.navigate(['/login']);
            }
            return throwError(() => error);
        })
    );
};
