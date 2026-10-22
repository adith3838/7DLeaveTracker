import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ApiRuntimeConfig {
    authApiUrl: string;
    employeeApiUrl: string;
    leaveApiUrl: string;
}

@Injectable({ providedIn: 'root' })
export class RuntimeConfigService {
    private config?: ApiRuntimeConfig;

    constructor(private http: HttpClient) { }

    async load(): Promise<void> {
        const config = await firstValueFrom(
            this.http.get<ApiRuntimeConfig>('/assets/app-config.json')
        );
        const urls = [config.authApiUrl, config.employeeApiUrl, config.leaveApiUrl];
        if (urls.some(url => typeof url !== 'string' || url.trim().length === 0)) {
            throw new Error('Runtime API configuration is missing one or more API URLs.');
        }
        if (environment.production && urls.some(url => /localhost|127\.0\.0\.1/i.test(url))) {
            throw new Error('Production API configuration must not point to localhost.');
        }

        this.config = {
            authApiUrl: config.authApiUrl.replace(/\/+$/, ''),
            employeeApiUrl: config.employeeApiUrl.replace(/\/+$/, ''),
            leaveApiUrl: config.leaveApiUrl.replace(/\/+$/, ''),
        };
    }

    get api(): ApiRuntimeConfig {
        if (!this.config) {
            throw new Error('Runtime API configuration has not been loaded.');
        }
        return this.config;
    }
}