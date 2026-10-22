import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { AuthResponse, LoginRequest, User } from '../models/api.models';
import { RuntimeConfigService } from './runtime-config.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private currentUserSubject = new BehaviorSubject<User | null>(null);
    currentUser$ = this.currentUserSubject.asObservable();

    constructor(private http: HttpClient, private runtimeConfig: RuntimeConfigService) {
        const stored = localStorage.getItem('elms_user');
        if (stored) {
            this.currentUserSubject.next(JSON.parse(stored));
        }
    }

    login(request: LoginRequest): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.runtimeConfig.api.authApiUrl}/auth/login`, request).pipe(
            tap(res => {
                localStorage.setItem('elms_token', res.accessToken);
                localStorage.setItem('elms_refresh', res.refreshToken);
                localStorage.setItem('elms_user', JSON.stringify(res.user));
                this.currentUserSubject.next(res.user);
            })
        );
    }

    logout(): void {
        localStorage.removeItem('elms_token');
        localStorage.removeItem('elms_refresh');
        localStorage.removeItem('elms_user');
        this.currentUserSubject.next(null);
    }

    getToken(): string | null {
        return localStorage.getItem('elms_token');
    }

    isLoggedIn(): boolean {
        return !!this.getToken();
    }

    getUser(): User | null {
        return this.currentUserSubject.value;
    }
}
