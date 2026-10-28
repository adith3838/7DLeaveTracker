import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { AiRuntimeStatus, ChatMessage, LeaveDraftRequest, LeaveDraftResponse } from '../../models/chat.models';
import { ChatApiService } from '../../services/chat-api.service';

@Component({
    selector: 'app-assistant',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
      <section class="assistant-page">
        <header class="assistant-heading">
          <div class="assistant-icon"><span class="material-symbols-outlined">auto_awesome</span></div>
          <div><small>ELMS · AI ASSISTANT</small><h1>How can I help?</h1><p>Ask about leave policy, your balance, requests, or holidays.</p></div>
        </header>
        <div class="error" *ngIf="runtimeMessage" role="status">{{ runtimeMessage }}</div>

        <div class="chat-panel" aria-live="polite">
          <article *ngFor="let message of messages" class="message" [class.user-message]="message.role === 'USER'">
            <strong>{{ message.role === 'USER' ? 'You' : 'Leave assistant' }}</strong>
            <p>{{ message.content }}</p>
            <div class="sources" *ngIf="message.sources?.length">
              <small>Policy sources</small>
              <span *ngFor="let source of message.sources">{{ source.title }}<ng-container *ngIf="source.section"> · {{ source.section }}</ng-container><ng-container *ngIf="source.version"> · v{{ source.version }}</ng-container></span>
            </div>
          </article>
          <p class="status" *ngIf="loading">Checking your leave information…</p>
          <p class="error" *ngIf="error">{{ error }}</p>
          <section class="draft-card" *ngIf="draft" aria-label="Leave request confirmation">
            <div><strong>{{ draft.status === 'SUBMITTED' ? 'Request submitted' : 'Review your request' }}</strong><p>{{ draft.leaveType }} leave · {{ draft.startDate }} to {{ draft.endDate }}</p><p>{{ draft.reason }}</p></div>
            <p class="draft-status">{{ draft.message }}</p>
            <button type="button" (click)="confirmDraft()" [disabled]="loading || draft.status !== 'AWAITING_CONFIRMATION'">{{ loading ? 'Submitting…' : (draft.status === 'SUBMITTED' ? 'Submitted ✓' : 'Confirm and submit leave') }}</button>
            <button class="secondary" type="button" (click)="draft = null" [disabled]="loading">{{ draft.status === 'SUBMITTED' ? 'Done' : 'Discard draft' }}</button>
          </section>
        </div>

        <section class="composer">
          <div class="draft-fields" *ngIf="showDraftForm">
            <label>Leave type<select [(ngModel)]="draftForm.leaveType" name="leaveType"><option value="PLANNED">Planned</option><option value="SICK">Sick</option><option value="CASUAL">Casual</option><option value="UNPAID">Unpaid</option></select></label>
            <label>Start date<input type="date" [(ngModel)]="draftForm.startDate" name="startDate"></label>
            <label>End date<input type="date" [(ngModel)]="draftForm.endDate" name="endDate"></label>
            <label class="reason-field">Reason<input type="text" maxlength="1000" [(ngModel)]="draftForm.reason" name="reason"></label>
            <button type="button" (click)="createDraft()" [disabled]="loading || !draftForm.startDate || !draftForm.endDate || !draftForm.reason.trim()">Create review draft</button>
          </div>
          <form (ngSubmit)="sendMessage()">
            <textarea name="message" [(ngModel)]="input" maxlength="2000" rows="2" [placeholder]="isAiDisabled ? 'AI assistant is unavailable' : 'For example: What is my leave balance?'" [disabled]="loading || isAiDisabled"></textarea>
            <button type="submit" [disabled]="loading || !input.trim() || isAiDisabled" aria-label="Send message"><span class="material-symbols-outlined">send</span></button>
          </form>
          <button type="button" class="draft-toggle" (click)="showDraftForm = !showDraftForm" [disabled]="loading || isAiDisabled" *ngIf="!isAiDisabled">{{ showDraftForm ? 'Hide leave form' : 'Prepare a leave request' }}</button>
        </section>
      </section>
    `,
    styles: [`
      :host { display:block; height:100%; }
      .assistant-page { display:flex; flex-direction:column; height:calc(100vh - 120px); max-width:880px; margin:0 auto; padding:0 12px; }
      .assistant-heading { display:flex; align-items:center; gap:12px; margin-bottom:12px; }
      .assistant-icon { display:grid; place-items:center; width:38px; height:38px; border-radius:10px; color:#fff; background:linear-gradient(135deg,#6366f1,#4338ca); }
      .assistant-heading small { font-size:10px; font-weight:700; color:#6366f1; letter-spacing:.05em; }
      .assistant-heading h1 { margin:0; font-size:18px; font-weight:700; }
      .assistant-heading p { margin:0; font-size:11px; color:#6b7280; }
      .chat-panel { flex:1; overflow-y:auto; padding:12px; border:1px solid #e5e7eb; border-radius:12px; background:#fff; display:flex; flex-direction:column; gap:12px; }
      .message { max-width:82%; padding:10px 14px; border-radius:12px; background:#f3f4f6; font-size:12px; line-height:1.45; }
      .message strong { display:block; margin-bottom:4px; font-size:11px; color:#4b5563; }
      .message p { margin:0; white-space:pre-wrap; }
      .user-message { align-self:flex-end; background:#e0e7ff; color:#1e1b4b; }
      .user-message strong { color:#4338ca; }
      .sources { margin-top:8px; padding-top:6px; border-top:1px dashed #d1d5db; display:flex; flex-wrap:wrap; gap:6px; align-items:center; }
      .sources small { font-size:9px; font-weight:700; color:#6b7280; text-transform:uppercase; }
      .sources span { font-size:10px; padding:2px 6px; border-radius:4px; background:#e5e7eb; color:#374151; }
      .status { font-size:11px; color:#6366f1; font-style:italic; }
      .error { font-size:11px; color:#dc2626; padding:8px; border-radius:6px; background:#fef2f2; }
      .composer { margin-top:10px; }
      .composer form { display:flex; gap:8px; }
      .composer form textarea { flex:1; resize:none; padding:8px 12px; border:1px solid #d1d5db; border-radius:10px; font-size:12px; outline:none; }
      .composer form textarea:focus { border-color:#6366f1; box-shadow:0 0 0 2px rgba(99,102,241,.15); }
      .composer form button,.draft-fields>button,.draft-card button { display:flex; align-items:center; justify-content:center; min-height:42px; padding:0 15px; border:0; border-radius:11px; color:#fff; background:#4f46e5; font-size:11px; font-weight:700; cursor:pointer; }
      .draft-toggle { margin-top:9px; padding:0; border:0; color:#4033c2; background:none; font-size:10px; font-weight:700; text-align:left; cursor:pointer; }
      .draft-fields { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:11px; }
      .draft-fields label { display:flex; flex-direction:column; gap:4px; color:#52586a; font-size:9px; font-weight:700; }
      .draft-fields input,.draft-fields select { min-width:0; height:36px; padding:0 8px; border:1px solid #dfe4ee; border-radius:8px; background:#fff; font:inherit; font-size:10px; }
      .draft-fields .reason-field { grid-column:1/-1; }
      .draft-fields>button { grid-column:1/-1; }
      .draft-card { padding:12px; border:1px solid #d8d3ff; border-radius:13px; background:#f8f7ff; }
      .draft-card strong { color:#3426b7; font-size:12px; }
      .draft-card p { margin:5px 0; font-size:10px; }
      .draft-card .draft-status { color:#51576a; }
      .draft-card button { width:100%; margin-top:8px; }
      .draft-card button.secondary { color:#4033c2; background:#e9e7ff; }
      @media(max-width:420px) { .draft-fields { grid-template-columns:1fr; }.draft-fields .reason-field,.draft-fields>button { grid-column:auto; } }
    `]
})
export class AssistantComponent {
    input = '';
    loading = false;
    error = '';
    conversationId: string | null = null;
    showDraftForm = false;
    draft: LeaveDraftResponse | null = null;
    runtimeMessage = '';
    isAiDisabled = false;
    draftForm: LeaveDraftRequest = { leaveType: 'PLANNED', startDate: '', endDate: '', reason: '' };
    messages: ChatMessage[] = [{ role: 'ASSISTANT', content: 'Hello! I can help with approved leave policies, your current balance, request status, and holidays.' }];

    constructor(private chatApi: ChatApiService) {
      this.chatApi.status().subscribe({
        next: (status: AiRuntimeStatus) => {
          if (!status.enabled) {
            this.isAiDisabled = true;
            this.runtimeMessage = 'AI assistant is disabled on the backend. Enable AI_ENABLED and configure the Gemini chat/embedding provider to use AI responses.';
          } else if (!status.chatModelConfigured || !status.embeddingModelConfigured || !status.vectorStoreConfigured) {
            this.isAiDisabled = false;
            this.runtimeMessage = 'Gemini AI is partially configured. Leave balance, request status, holidays, and leave drafts are active.';
          } else {
            this.isAiDisabled = false;
            this.runtimeMessage = '';
          }
        },
        error: () => {
          this.isAiDisabled = true;
          this.runtimeMessage = 'Could not reach the leave-service AI status endpoint. Check that leave-service is running and the API URL points to port 8083.';
        }
      });
    }

    sendMessage(): void {
        const message = this.input.trim();
        if (!message || this.loading || this.isAiDisabled) return;
        this.messages = [...this.messages, { role: 'USER', content: message }];
        this.input = '';
        this.loading = true;
        this.error = '';
        this.chatApi.sendMessage({ conversationId: this.conversationId, message }).pipe(finalize(() => this.loading = false)).subscribe({
            next: response => {
                this.conversationId = response.conversationId;
                this.messages = [...this.messages, { role: 'ASSISTANT', content: response.answer, sources: response.sources }];
                if (response.draft) {
                    this.draft = response.draft;
                    this.showDraftForm = false;
                } else if (response.intent === 'APPLY_LEAVE') {
                    this.showDraftForm = true;
                }
            },
            error: error => this.error = error.error?.message || error.error?.error || (error.status === 401 || error.status === 403 ? 'Your session has expired or is invalid. Please log in again.' : 'The assistant is temporarily unavailable. Please try again.')
        });
    }

    createDraft(): void {
        this.loading = true;
        this.error = '';
        this.chatApi.createLeaveDraft(this.draftForm).pipe(finalize(() => this.loading = false)).subscribe({
            next: draft => { this.draft = draft; this.showDraftForm = false; },
            error: error => this.error = error.error?.error || error.error?.message || 'Could not create the leave draft.'
        });
    }

    confirmDraft(): void {
        if (!this.draft || this.draft.status !== 'AWAITING_CONFIRMATION') return;
        this.loading = true;
        this.error = '';
        this.chatApi.confirmLeaveDraft(this.draft.draftId).pipe(finalize(() => this.loading = false)).subscribe({
            next: response => {
                this.draft = response;
                if (response.status === 'SUBMITTED') {
                    this.messages = [...this.messages, {
                        role: 'ASSISTANT',
                        content: response.message || 'Leave request submitted successfully!'
                    }];
                }
            },
            error: error => this.error = error.error?.error || error.error?.message || 'Could not submit the leave request.'
        });
    }
}
