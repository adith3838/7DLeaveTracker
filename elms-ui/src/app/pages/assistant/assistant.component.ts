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
            <div><strong>Review your request</strong><p>{{ draft.leaveType }} leave · {{ draft.startDate }} to {{ draft.endDate }}</p><p>{{ draft.reason }}</p></div>
            <p class="draft-status">{{ draft.message }}</p>
            <button type="button" (click)="confirmDraft()" [disabled]="loading || draft.status !== 'AWAITING_CONFIRMATION'">{{ loading ? 'Submitting…' : 'Confirm and submit leave' }}</button>
            <button class="secondary" type="button" (click)="draft = null" [disabled]="loading">Discard draft</button>
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
          <small>Leave applications are submitted only after you review and confirm.</small>
        </section>
      </section>
    `,
    styles: [`
      :host { display:block; }
      .assistant-page { display:flex; flex-direction:column; gap:16px; min-height:calc(100dvh - 150px); }
      .assistant-heading { display:flex; align-items:center; gap:13px; padding:17px; border-radius:18px; background:linear-gradient(130deg,#3525cd,#7166ec); color:#fff; }
      .assistant-icon { display:grid; place-items:center; flex:0 0 43px; height:43px; border-radius:14px; background:#ffffff24; }
      .assistant-icon span { font-size:23px; }.assistant-heading small { opacity:.8; font-size:9px; font-weight:700; letter-spacing:.1em; }
      .assistant-heading h1 { margin:3px 0; font-size:19px; }.assistant-heading p { margin:0; color:#eeecff; font-size:10px; }
      .chat-panel { display:flex; flex:1; flex-direction:column; gap:10px; padding:12px; border:1px solid #edf0f6; border-radius:17px; background:#fff; }
      .message { max-width:90%; padding:11px 13px; border-radius:14px 14px 14px 4px; background:#eff4ff; color:#24283a; }
      .message strong { color:#3d31bf; font-size:10px; }.message p { margin:5px 0 0; font-size:12px; line-height:1.5; white-space:pre-wrap; }
      .user-message { align-self:flex-end; border-radius:14px 14px 4px 14px; background:#e5e3ff; }.user-message strong { color:#3025aa; }
      .sources { display:flex; flex-wrap:wrap; gap:5px; margin-top:8px; }.sources small { width:100%; color:#626982; font-weight:700; }.sources span { padding:4px 7px; border-radius:8px; color:#3d31bf; background:#fff; font-size:9px; }
      .status,.error { margin:0; padding:9px 11px; border-radius:10px; font-size:11px; }.status { color:#4f46e5; background:#f2f0ff; }.error { color:#991b1b; background:#fee4e2; }
      .composer { position:sticky; bottom:0; padding:10px; border:1px solid #edf0f6; border-radius:16px; background:#fff; box-shadow:0 -4px 20px #17243b0a; }
      .composer form { display:flex; align-items:flex-end; gap:8px; }.composer textarea { flex:1; resize:vertical; min-height:45px; max-height:120px; padding:11px; border:1px solid #e1e5ef; border-radius:12px; outline:none; font:inherit; font-size:12px; }
      .composer form button,.draft-fields>button,.draft-card button { display:flex; align-items:center; justify-content:center; min-height:42px; padding:0 15px; border:0; border-radius:11px; color:#fff; background:#4f46e5; font-size:11px; font-weight:700; }
      .composer form button { width:44px; padding:0; }.composer button:disabled { opacity:.5; }
      .draft-toggle { margin-top:9px; padding:0; border:0; color:#4033c2; background:none; font-size:10px; font-weight:700; text-align:left; }
      .composer>small { display:block; margin-top:8px; color:#777d8d; font-size:9px; }
      .draft-fields { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:11px; }.draft-fields label { display:flex; flex-direction:column; gap:4px; color:#52586a; font-size:9px; font-weight:700; }.draft-fields input,.draft-fields select { min-width:0; height:36px; padding:0 8px; border:1px solid #dfe4ee; border-radius:8px; background:#fff; font:inherit; font-size:10px; }.draft-fields .reason-field { grid-column:1/-1; }.draft-fields>button { grid-column:1/-1; }
      .draft-card { padding:12px; border:1px solid #d8d3ff; border-radius:13px; background:#f8f7ff; }.draft-card strong { color:#3426b7; font-size:12px; }.draft-card p { margin:5px 0; font-size:10px; }.draft-card .draft-status { color:#51576a; }.draft-card button { width:100%; margin-top:8px; }.draft-card button.secondary { color:#4033c2; background:#e9e7ff; }
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
                if (response.intent === 'APPLY_LEAVE') this.showDraftForm = true;
            },
            error: error => this.error = error.error?.message || error.error?.error || (error.status === 401 || error.status === 403 ? 'Your session has expired or is invalid. Please log in again.' : 'The assistant is temporarily unavailable. Please try again.')
        });
    }

    createDraft(): void {
        this.loading = true;
        this.error = '';
        this.chatApi.createLeaveDraft(this.draftForm).pipe(finalize(() => this.loading = false)).subscribe({
            next: draft => { this.draft = draft; this.showDraftForm = false; },
            error: error => this.error = error.error?.error || 'Could not create the leave draft.'
        });
    }

    confirmDraft(): void {
        if (!this.draft || this.draft.status !== 'AWAITING_CONFIRMATION') return;
        this.loading = true;
        this.error = '';
        this.chatApi.confirmLeaveDraft(this.draft.draftId).pipe(finalize(() => this.loading = false)).subscribe({
            next: response => this.draft = response,
            error: error => this.error = error.error?.error || 'Could not submit the leave request.'
        });
    }
}
