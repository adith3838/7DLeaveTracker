import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RuntimeConfigService } from './runtime-config.service';
import { PolicyDocument, PolicyDocumentPage, PolicyIngestionResult, PolicyKnowledgeHealth, PolicyUploadMetadata } from '../models/policy.models';

@Injectable({ providedIn: 'root' })
export class PolicyIngestionService {
    private readonly baseUrl: string;

    constructor(private http: HttpClient, config: RuntimeConfigService) {
        this.baseUrl = `${config.api.leaveApiUrl}/ai/admin/policies`;
    }

    list(filters: { search: string; processingStatus: string; approvalStatus: string; policyType: string; page: number; size: number }): Observable<PolicyDocumentPage> {
        let params = new HttpParams().set('page', filters.page).set('size', filters.size);
        if (filters.search) params = params.set('search', filters.search);
        if (filters.processingStatus) params = params.set('processingStatus', filters.processingStatus);
        if (filters.approvalStatus) params = params.set('approvalStatus', filters.approvalStatus);
        if (filters.policyType) params = params.set('policyType', filters.policyType);
        return this.http.get<PolicyDocumentPage>(this.baseUrl, { params });
    }

    get(documentId: string): Observable<PolicyDocument> {
        return this.http.get<PolicyDocument>(`${this.baseUrl}/${encodeURIComponent(documentId)}`);
    }

    health(): Observable<PolicyKnowledgeHealth> {
        return this.http.get<PolicyKnowledgeHealth>(`${this.baseUrl}/health`);
    }

    upload(file: File, metadata: PolicyUploadMetadata): Observable<HttpEvent<PolicyIngestionResult>> {
        const form = new FormData();
        form.append('file', file, file.name);
        form.append('title', metadata.title);
        form.append('policyType', metadata.policyType);
        form.append('version', metadata.version);
        if (metadata.effectiveFrom) form.append('effectiveFrom', metadata.effectiveFrom);
        if (metadata.effectiveTo) form.append('effectiveTo', metadata.effectiveTo);
        return this.http.post<PolicyIngestionResult>(`${this.baseUrl}/ingest`, form, {
            observe: 'events',
            reportProgress: true,
        });
    }

    approve(documentId: string): Observable<PolicyDocument> {
        return this.http.patch<PolicyDocument>(`${this.baseUrl}/${encodeURIComponent(documentId)}/approval`, {});
    }

    archive(documentId: string): Observable<PolicyDocument> {
        return this.http.post<PolicyDocument>(`${this.baseUrl}/${encodeURIComponent(documentId)}/archive`, {});
    }
}
