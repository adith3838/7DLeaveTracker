import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RuntimeConfigService } from './runtime-config.service';
import { AiRuntimeStatus, ChatRequest, ChatResponse, LeaveDraftRequest, LeaveDraftResponse } from '../models/chat.models';

@Injectable({ providedIn: 'root' })
export class ChatApiService {
    constructor(private http: HttpClient, private config: RuntimeConfigService) { }

    status(): Observable<AiRuntimeStatus> {
        return this.http.get<AiRuntimeStatus>(`${this.config.api.leaveApiUrl}/ai/status`);
    }

    sendMessage(request: ChatRequest): Observable<ChatResponse> {
        return this.http.post<ChatResponse>(`${this.config.api.leaveApiUrl}/ai/chat`, request);
    }

    createLeaveDraft(request: LeaveDraftRequest): Observable<LeaveDraftResponse> {
        return this.http.post<LeaveDraftResponse>(`${this.config.api.leaveApiUrl}/ai/leave-drafts`, request);
    }

    confirmLeaveDraft(draftId: string): Observable<LeaveDraftResponse> {
        return this.http.post<LeaveDraftResponse>(
            `${this.config.api.leaveApiUrl}/ai/leave-drafts/${encodeURIComponent(draftId)}/confirm`, {});
    }
}
