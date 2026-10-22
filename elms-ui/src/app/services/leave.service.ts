import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LeaveBalance, LeaveRequest, LeaveResponse, Holiday } from '../models/api.models';
import { AuthService } from './auth.service';
import { RuntimeConfigService } from './runtime-config.service';

@Injectable({ providedIn: 'root' })
export class LeaveService {
    constructor(
        private http: HttpClient,
        private authService: AuthService,
        private runtimeConfig: RuntimeConfigService,
    ) { }

    private getHeaders(): HttpHeaders {
        const user = this.authService.getUser();
        return new HttpHeaders({
            'X-Employee-Id': user?.id?.toString() || '0',
        });
    }

    applyLeave(request: LeaveRequest): Observable<LeaveResponse> {
        return this.http.post<LeaveResponse>(
            `${this.runtimeConfig.api.leaveApiUrl}/leaves`, request, { headers: this.getHeaders() }
        );
    }

    getMyLeaves(): Observable<LeaveResponse[]> {
        return this.http.get<LeaveResponse[]>(
            `${this.runtimeConfig.api.leaveApiUrl}/leaves`, { headers: this.getHeaders() }
        );
    }

    getBalance(): Observable<LeaveBalance[]> {
        return this.http.get<LeaveBalance[]>(
            `${this.runtimeConfig.api.leaveApiUrl}/leaves/balance`, { headers: this.getHeaders() }
        );
    }

    getPendingLeaves(reporteeIds: number[]): Observable<LeaveResponse[]> {
        const params = reporteeIds.map(id => `reporteeIds=${id}`).join('&');
        return this.http.get<LeaveResponse[]>(
            `${this.runtimeConfig.api.leaveApiUrl}/leaves/pending?${params}`, { headers: this.getHeaders() }
        );
    }

    approveLeave(id: number): Observable<LeaveResponse> {
        return this.http.post<LeaveResponse>(
            `${this.runtimeConfig.api.leaveApiUrl}/leaves/${id}/approve`, {}, { headers: this.getHeaders() }
        );
    }

    rejectLeave(id: number): Observable<LeaveResponse> {
        return this.http.post<LeaveResponse>(
            `${this.runtimeConfig.api.leaveApiUrl}/leaves/${id}/reject`, {}, { headers: this.getHeaders() }
        );
    }

    getHolidays(): Observable<Holiday[]> {
        return this.http.get<Holiday[]>(`${this.runtimeConfig.api.leaveApiUrl}/holidays`);
    }

    getUpcomingHolidays(): Observable<Holiday[]> {
        return this.http.get<Holiday[]>(`${this.runtimeConfig.api.leaveApiUrl}/holidays/upcoming`);
    }
}
