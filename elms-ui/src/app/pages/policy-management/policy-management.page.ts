import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { HttpEventType } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { finalize, Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { PolicyIngestionService } from '../../services/policy-ingestion.service';
import { PolicyDocument, PolicyKnowledgeHealth, PolicyUploadMetadata } from '../../models/policy.models';

interface PendingUpload {
    id: string;
    file: File;
    progress: number;
    status: 'QUEUED' | 'UPLOADING' | 'READY' | 'FAILED' | 'CANCELLED';
    message?: string;
    subscription?: Subscription;
}

@Component({
    selector: 'app-policy-management',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, DatePipe, DecimalPipe],
    template: `
      <section class="policy-page">
        <nav class="breadcrumbs" aria-label="Breadcrumb"><a routerLink="/dashboard">Admin</a><span>/</span><strong>AI Knowledge Base</strong></nav>
        <header class="page-header">
          <div><span class="eyebrow">PEOPLE OPERATIONS · KNOWLEDGE BASE</span><h1>AI Leave Policy Management</h1><p>Upload and manage the approved documents that power your AI leave assistant.</p></div>
          <button class="primary-button" type="button" (click)="uploadPanelOpen = !uploadPanelOpen"><span class="material-symbols-outlined">upload_file</span>Upload Policy Document</button>
        </header>

        <div class="access-denied" *ngIf="!canManage"><span class="material-symbols-outlined">lock</span><strong>HR administrator access required</strong><p>This knowledge base is limited to HR and Admin accounts.</p></div>
        <ng-container *ngIf="canManage">
          <div class="health-banner" [class.health-good]="health?.operational" [class.health-bad]="health && !health.operational" [class.health-unknown]="!health">
            <span class="health-dot"></span>
            <strong>{{ health ? (health.operational ? 'Knowledge base operational' : 'Knowledge base needs attention') : (healthLoading ? 'Checking knowledge base…' : (healthError ? 'AI policy service is not enabled' : 'Knowledge base status unavailable')) }}</strong>
            <span class="health-detail" *ngIf="healthError">{{ healthError }}</span>
            <span class="health-detail" *ngIf="health">{{ health.approvedEffectiveDocuments }} approved, effective policies · pgvector {{ health.pgvectorAvailable ? 'connected' : 'unavailable' }} · AI models {{ health.embeddingConfigured && health.chatConfigured ? 'configured' : 'not configured' }}</span>
            <button type="button" (click)="loadHealth()" [disabled]="healthLoading" aria-label="Refresh knowledge base health"><span class="material-symbols-outlined">refresh</span></button>
          </div>

          <div class="summary-grid" *ngIf="counts">
            <article class="summary-card"><span class="summary-icon icon-total material-symbols-outlined">description</span><div><small>Total documents</small><strong>{{ counts.total }}</strong></div></article>
            <article class="summary-card"><span class="summary-icon icon-ready material-symbols-outlined">verified</span><div><small>Ready for AI</small><strong>{{ counts.ready }}</strong></div></article>
            <article class="summary-card"><span class="summary-icon icon-processing material-symbols-outlined">progress_activity</span><div><small>Processing</small><strong>{{ counts.processing }}</strong></div></article>
            <article class="summary-card"><span class="summary-icon icon-failed material-symbols-outlined">error</span><div><small>Failed</small><strong>{{ counts.failed }}</strong></div></article>
          </div>

          <section class="upload-card" *ngIf="uploadPanelOpen">
            <div class="section-heading"><div><span class="section-mark material-symbols-outlined">cloud_upload</span><div><h2>Upload policy documents</h2><p>Each file is sent individually and indexed synchronously by the current API.</p></div></div><button class="icon-button" type="button" (click)="uploadPanelOpen = false" aria-label="Close upload panel"><span class="material-symbols-outlined">close</span></button></div>
            <form [formGroup]="metadataForm" (ngSubmit)="startUploads()">
              <div class="metadata-grid">
                <label>Policy title<input formControlName="title" maxlength="250" placeholder="e.g. Annual Leave Policy"></label>
                <label>Policy type<select formControlName="policyType"><option value="GENERAL">General policy</option><option value="ANNUAL_LEAVE">Annual leave</option><option value="SICK_LEAVE">Sick leave</option><option value="MATERNITY_LEAVE">Maternity leave</option><option value="UNPAID_LEAVE">Unpaid leave</option><option value="OTHER">Other</option></select></label>
                <label>Version<input formControlName="version" maxlength="50" placeholder="e.g. 2026.1"></label>
                <label>Effective from<input type="date" formControlName="effectiveFrom"></label>
                <label>Effective to <span class="optional-label">Optional</span><input type="date" formControlName="effectiveTo"></label>
              </div>
              <div class="drop-zone" [class.dragging]="dragging" (dragover)="onDragOver($event)" (dragleave)="dragging = false" (drop)="onDrop($event)">
                <span class="drop-icon material-symbols-outlined">drive_folder_upload</span><strong>Drag and drop your policy files here</strong><span>Or browse files from your computer</span>
                <label class="browse-button">Browse files<input type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" multiple (change)="onFilesSelected($event)"></label>
                <small>PDF or DOCX · Up to 10 MB per file · Multiple files are uploaded one at a time</small>
              </div>
                            <p class="inline-error" *ngIf="uploadPrerequisiteMessage">{{ uploadPrerequisiteMessage }}</p>
              <div class="upload-list" *ngIf="uploads.length">
                <div class="upload-row" *ngFor="let upload of uploads">
                  <span class="file-icon material-symbols-outlined">{{ upload.file.name.toLowerCase().endsWith('.pdf') ? 'picture_as_pdf' : 'article' }}</span>
                  <div class="file-info"><strong>{{ upload.file.name }}</strong><small>{{ upload.file.size | number }} bytes · {{ upload.file.name.split('.').pop()?.toUpperCase() }}</small><div class="progress-track" *ngIf="upload.status === 'UPLOADING'"><i [style.width.%]="upload.progress"></i></div><small class="upload-message" *ngIf="upload.message">{{ upload.message }}</small></div>
                  <span class="mini-status" [class]="'mini-status ' + upload.status.toLowerCase()">{{ upload.status === 'READY' ? 'Upload & indexing complete' : upload.status }}</span>
                  <button type="button" class="icon-button" (click)="cancelOrRemove(upload)" [disabled]="upload.status === 'READY'" [attr.aria-label]="upload.status === 'UPLOADING' ? 'Cancel upload' : 'Remove file'"><span class="material-symbols-outlined">{{ upload.status === 'UPLOADING' ? 'cancel' : 'close' }}</span></button>
                </div>
              </div>
              <p class="inline-error" *ngIf="uploadError">{{ uploadError }}</p>
              <div class="upload-actions"><button class="secondary-button" type="button" (click)="clearFinishedUploads()" [disabled]="hasActiveUpload">Clear finished</button><button class="primary-button" type="submit" [disabled]="metadataForm.invalid || !hasQueuedUpload || hasActiveUpload || !!uploadPrerequisiteMessage"><span class="material-symbols-outlined">auto_awesome</span>Upload and Process</button></div>
            </form>
          </section>

          <section class="documents-card">
            <div class="documents-header"><div><span class="eyebrow">POLICY LIBRARY</span><h2>Policy Documents <span class="result-count" *ngIf="total !== null">{{ total }}</span></h2></div><button class="secondary-button refresh-button" type="button" (click)="loadDocuments()" [disabled]="loading"><span class="material-symbols-outlined">refresh</span>Refresh status</button></div>
            <div class="filters">
              <label class="search-box"><span class="material-symbols-outlined">search</span><input [(ngModel)]="search" [ngModelOptions]="{standalone:true}" (input)="filtersChanged()" placeholder="Search name or title" aria-label="Search policy documents"><button type="button" *ngIf="search" (click)="search='';filtersChanged()" aria-label="Clear search"><span class="material-symbols-outlined">close</span></button></label>
              <select [(ngModel)]="processingStatus" [ngModelOptions]="{standalone:true}" (change)="filtersChanged()" aria-label="Filter by processing status"><option value="">All processing statuses</option><option value="QUEUED">Queued</option><option value="PROCESSING">Processing</option><option value="READY">Ready</option><option value="FAILED">Failed</option><option value="CANCELLED">Cancelled</option></select>
              <select [(ngModel)]="approvalStatus" [ngModelOptions]="{standalone:true}" (change)="filtersChanged()" aria-label="Filter by approval status"><option value="">All approval statuses</option><option value="DRAFT">Draft</option><option value="PENDING_APPROVAL">Pending approval</option><option value="APPROVED">Approved</option><option value="ARCHIVED">Archived</option></select>
              <select [(ngModel)]="policyType" [ngModelOptions]="{standalone:true}" (change)="filtersChanged()" aria-label="Filter by policy type"><option value="">All policy types</option><option *ngFor="let type of policyTypes" [value]="type">{{ policyTypeLabel(type) }}</option></select>
              <button class="clear-filters" type="button" (click)="clearFilters()" [disabled]="!hasFilters">Clear filters</button>
            </div>
            <div class="table-message" *ngIf="loading"><span class="material-symbols-outlined spin">progress_activity</span>Loading policy documents…</div>
            <div class="table-message error-box" *ngIf="!loading && listError"><span class="material-symbols-outlined">cloud_off</span><div><strong>Could not load policy documents</strong><p>{{ listError }}</p><button class="secondary-button" type="button" (click)="loadDocuments()">Try again</button></div></div>
            <div class="table-message" *ngIf="!loading && !listError && documents.length === 0"><span class="material-symbols-outlined">inventory_2</span><div><strong>{{ hasFilters ? 'No matching policies' : 'No policy documents yet' }}</strong><p>{{ hasFilters ? 'Try clearing one or more filters.' : 'Upload an approved policy document to begin building the knowledge base.' }}</p></div></div>
            <div class="table-scroll" *ngIf="!loading && !listError && documents.length">
              <table><thead><tr><th>Document</th><th>Policy type</th><th>Version</th><th>Uploaded</th><th>Processing</th><th>Approval</th><th>Actions</th></tr></thead>
                <tbody><tr *ngFor="let document of documents">
                  <td><button class="document-link" type="button" (click)="openDetails(document)"><span class="file-icon material-symbols-outlined">{{ document.filename.toLowerCase().endsWith('.pdf') ? 'picture_as_pdf' : 'article' }}</span><span><strong>{{ document.filename }}</strong><small>{{ document.title }}</small></span></button></td>
                  <td>{{ policyTypeLabel(document.policyType) }}</td><td>{{ document.version }}</td><td><strong>{{ document.uploadedAt | date:'MMM d, y' }}</strong><small class="sub-cell">{{ document.uploadedBy || 'Unknown uploader' }}</small></td>
                  <td><span class="status-badge" [class]="'status-badge processing-' + document.processingStatus.toLowerCase()"><i></i>{{ processingLabel(document.processingStatus, document.processingStage) }}</span></td>
                  <td><span class="approval-badge" [class]="'approval-' + document.approvalStatus.toLowerCase()">{{ approvalLabel(document.approvalStatus) }}</span></td>
                  <td><div class="row-actions"><button type="button" (click)="openDetails(document)" aria-label="View details"><span class="material-symbols-outlined">visibility</span></button><button *ngIf="canApprove(document)" type="button" (click)="approve(document)" aria-label="Approve document"><span class="material-symbols-outlined">task_alt</span></button><button *ngIf="document.approvalStatus !== 'ARCHIVED'" type="button" (click)="archive(document)" aria-label="Archive document"><span class="material-symbols-outlined">archive</span></button></div></td>
                </tr></tbody>
              </table>
            </div>
            <footer class="pagination" *ngIf="total !== null && total > pageSize"><span>Showing {{ page * pageSize + 1 }}–{{ Math.min((page + 1) * pageSize, total) }} of {{ total }}</span><div><button type="button" (click)="changePage(-1)" [disabled]="page === 0" aria-label="Previous page"><span class="material-symbols-outlined">chevron_left</span></button><span>Page {{ page + 1 }} of {{ totalPages }}</span><button type="button" (click)="changePage(1)" [disabled]="page + 1 >= totalPages" aria-label="Next page"><span class="material-symbols-outlined">chevron_right</span></button></div></footer>
          </section>
        </ng-container>

        <div class="toast" role="status" *ngIf="toastMessage" [class.toast-error]="toastError"><span class="material-symbols-outlined">{{ toastError ? 'error' : 'check_circle' }}</span>{{ toastMessage }}<button type="button" (click)="toastMessage=''" aria-label="Dismiss notification"><span class="material-symbols-outlined">close</span></button></div>

        <div class="drawer-backdrop" *ngIf="selectedDocument" (click)="closeDetails()" role="presentation">
          <aside class="details-drawer" (click)="$event.stopPropagation()" role="dialog" aria-modal="true" aria-labelledby="drawer-title">
            <header><div><span class="eyebrow">DOCUMENT DETAILS</span><h2 id="drawer-title">{{ selectedDocument.title }}</h2></div><button class="icon-button" type="button" (click)="closeDetails()" aria-label="Close details"><span class="material-symbols-outlined">close</span></button></header>
            <div class="drawer-content" *ngIf="!detailLoading">
              <div class="detail-badges"><span class="status-badge" [class]="'status-badge processing-' + selectedDocument.processingStatus.toLowerCase()"><i></i>{{ processingLabel(selectedDocument.processingStatus, selectedDocument.processingStage) }}</span><span class="approval-badge" [class]="'approval-' + selectedDocument.approvalStatus.toLowerCase()">{{ approvalLabel(selectedDocument.approvalStatus) }}</span></div>
              <section class="detail-section"><h3>Document information</h3><dl><div><dt>Filename</dt><dd>{{ selectedDocument.filename }}</dd></div><div><dt>Policy type</dt><dd>{{ policyTypeLabel(selectedDocument.policyType) }}</dd></div><div><dt>Version</dt><dd>{{ selectedDocument.version }}</dd></div><div><dt>Effective dates</dt><dd>{{ selectedDocument.effectiveFrom || 'Not specified' }} – {{ selectedDocument.effectiveTo || 'No end date' }}</dd></div><div><dt>Uploaded by</dt><dd>{{ selectedDocument.uploadedBy || 'Unknown' }}</dd></div><div><dt>Uploaded on</dt><dd>{{ selectedDocument.uploadedAt | date:'medium' }}</dd></div><div><dt>Last updated</dt><dd>{{ selectedDocument.updatedAt | date:'medium' }}</dd></div></dl></section>
              <section class="detail-section"><h3>Ingestion pipeline</h3><ol class="pipeline"><li *ngFor="let stage of selectedDocument.pipeline" [class]="'pipeline-' + stage.status.toLowerCase()"><span class="pipeline-icon material-symbols-outlined">{{ pipelineIcon(stage.status) }}</span><div><strong>{{ pipelineLabel(stage.name) }}</strong><small>{{ pipelineStatusLabel(stage.status) }}</small><p *ngIf="stage.status === 'FAILED' && selectedDocument.failureReason">{{ selectedDocument.failureReason }}</p></div></li></ol><small class="pipeline-note">The current API provides the current stage and overall timestamps; it does not record per-stage timestamps.</small></section>
              <section class="detail-section"><h3>Processing metrics</h3><div class="metric-grid"><div><strong>{{ selectedDocument.extractedCharacters === null ? '—' : (selectedDocument.extractedCharacters | number) }}</strong><small>Extracted characters</small></div><div><strong>{{ selectedDocument.chunksIndexed === null ? '—' : selectedDocument.chunksIndexed }}</strong><small>Chunks indexed</small></div><div><strong>{{ durationLabel(selectedDocument) }}</strong><small>Processing duration</small></div></div></section>
              <div class="drawer-error" *ngIf="selectedDocument.failureReason"><strong>Processing failed</strong><p>{{ selectedDocument.failureReason }}</p><small>Retry is not available yet. Re-upload this file after correcting the issue.</small></div>
              <div class="drawer-actions"><button class="primary-button" type="button" *ngIf="canApprove(selectedDocument)" (click)="approve(selectedDocument)">Approve for AI retrieval</button><button class="secondary-button" type="button" *ngIf="selectedDocument.approvalStatus !== 'ARCHIVED'" (click)="archive(selectedDocument)">Archive document</button></div>
            </div>
            <div class="table-message" *ngIf="detailLoading"><span class="material-symbols-outlined spin">progress_activity</span>Loading document details…</div>
          </aside>
        </div>
      </section>
    `,
    styles: [`
      :host { display:block; color:#202438; }
      .policy-page { display:flex; flex-direction:column; gap:16px; padding:4px 0 30px; }
      .breadcrumbs { display:flex; align-items:center; gap:8px; color:#8a90a1; font-size:10px; }.breadcrumbs a { color:#5144d1; text-decoration:none; }.breadcrumbs strong { color:#4b5062; font-weight:600; }
      .page-header { display:flex; justify-content:space-between; align-items:flex-end; gap:16px; }.eyebrow { color:#766be2; font-size:9px; font-weight:800; letter-spacing:.11em; }.page-header h1 { margin:5px 0 4px; font-size:clamp(21px,4vw,29px); letter-spacing:-.04em; }.page-header p { margin:0; color:#777d8e; font-size:11px; }
      button { font:inherit; cursor:pointer; }.primary-button,.secondary-button { display:inline-flex; align-items:center; justify-content:center; gap:7px; min-height:39px; padding:0 14px; border:0; border-radius:10px; font-size:10px; font-weight:700; white-space:nowrap; }.primary-button { color:#fff; background:linear-gradient(100deg,#5044d7,#7165e8); box-shadow:0 4px 12px #5145d42b; }.secondary-button { color:#4f5365; border:1px solid #e5e7ef; background:#fff; }.primary-button .material-symbols-outlined,.secondary-button .material-symbols-outlined { font-size:17px; }.primary-button:disabled,.secondary-button:disabled { opacity:.5; cursor:not-allowed; }
      .health-banner { display:flex; align-items:center; gap:9px; min-height:41px; padding:8px 12px; border:1px solid #e6e8f1; border-radius:12px; background:#fff; font-size:10px; }.health-good { border-color:#ccebdd; background:#f5fcf8; }.health-bad { border-color:#f5dfbd; background:#fffaf2; }.health-unknown { color:#6d7384; }.health-dot { width:8px; height:8px; flex:0 0 8px; border-radius:50%; background:#9298a7; }.health-good .health-dot { background:#1aa36f; box-shadow:0 0 0 3px #1aa36f1c; }.health-bad .health-dot { background:#db8a21; }.health-detail { flex:1; color:#777d8e; font-size:9px; }.health-banner>button { display:grid; place-items:center; width:28px; height:28px; border:0; border-radius:8px; color:#62687b; background:transparent; }.health-banner>button .material-symbols-outlined { font-size:17px; }
      .summary-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:10px; }.summary-card { display:flex; align-items:center; gap:11px; min-height:76px; padding:13px; border:1px solid #eceef4; border-radius:14px; background:#fff; box-shadow:0 2px 8px #15274a06; }.summary-icon { display:grid; place-items:center; width:36px; height:36px; flex:0 0 36px; border-radius:11px; font-size:19px; }.icon-total { color:#5144d1; background:#eeecff; }.icon-ready { color:#128354; background:#e3f7ed; }.icon-processing { color:#2478b8; background:#e7f3fc; }.icon-failed { color:#c2413b; background:#fff0ef; }.summary-card div { display:flex; flex-direction:column; gap:4px; }.summary-card small { color:#84899a; font-size:9px; }.summary-card strong { font-size:20px; letter-spacing:-.03em; }
      .upload-card,.documents-card { border:1px solid #e9ebf2; border-radius:16px; background:#fff; box-shadow:0 3px 12px #15274a08; }.upload-card { padding:17px; }.section-heading,.documents-header { display:flex; justify-content:space-between; align-items:center; gap:10px; }.section-heading>div { display:flex; align-items:center; gap:10px; }.section-mark { display:grid; place-items:center; width:38px; height:38px; border-radius:12px; color:#5144d1; background:#efedff; font-size:20px; }.section-heading h2,.documents-header h2 { margin:2px 0; font-size:15px; letter-spacing:-.025em; }.section-heading p { margin:3px 0 0; color:#858b9b; font-size:10px; }.icon-button { display:grid; place-items:center; width:30px; height:30px; border:0; border-radius:8px; color:#73798b; background:#f5f6f9; }.icon-button .material-symbols-outlined { font-size:17px; }.metadata-grid { display:grid; grid-template-columns:2fr 1.3fr 1fr 1.2fr 1.2fr; gap:10px; margin:15px 0 12px; }.metadata-grid label { display:flex; flex-direction:column; gap:5px; color:#606679; font-size:9px; font-weight:700; }.metadata-grid input,.metadata-grid select { width:100%; min-width:0; height:36px; padding:0 9px; border:1px solid #e0e4ed; border-radius:8px; outline:0; color:#34394c; background:#fff; font:inherit; font-size:10px; }.metadata-grid input:focus,.metadata-grid select:focus { border-color:#786deb; box-shadow:0 0 0 3px #7165e81a; }.optional-label { color:#9a9eaa; font-weight:400; }
      .drop-zone { display:flex; flex-direction:column; align-items:center; gap:6px; padding:20px 12px; border:1px dashed #c8c5e7; border-radius:12px; background:#fbfaff; color:#666c7f; font-size:10px; }.drop-zone.dragging { border-color:#5144d1; background:#f0efff; }.drop-icon { color:#685cda; font-size:25px; }.drop-zone>strong { color:#373c50; font-size:11px; }.drop-zone>span:not(.drop-icon) { color:#818698; }.browse-button { display:inline-flex; align-items:center; justify-content:center; min-height:30px; margin:3px 0; padding:0 11px; border:1px solid #dedbf9; border-radius:8px; color:#5144d1; background:#fff; font-size:9px; font-weight:700; cursor:pointer; }.browse-button input { display:none; }.drop-zone small { color:#999dad; font-size:8px; text-align:center; }
      .upload-list { display:flex; flex-direction:column; gap:7px; margin-top:10px; }.upload-row { display:flex; align-items:center; gap:9px; padding:9px; border:1px solid #eceef4; border-radius:10px; }.file-icon { color:#685cda; font-size:20px; }.file-info { display:flex; flex:1; flex-direction:column; min-width:0; gap:3px; }.file-info strong { overflow:hidden; color:#3d4255; font-size:10px; text-overflow:ellipsis; white-space:nowrap; }.file-info small { color:#8a90a0; font-size:8px; }.mini-status { color:#7a8090; font-size:8px; white-space:nowrap; }.mini-status.ready { color:#128354; }.mini-status.failed { color:#bf3933; }.mini-status.uploading { color:#236da7; }.upload-message { color:#b33c36!important; }.progress-track { height:4px; overflow:hidden; border-radius:5px; background:#e8eaf0; }.progress-track i { display:block; height:100%; border-radius:5px; background:#6255dc; transition:width .15s; }.upload-row .icon-button:disabled { opacity:.4; }.upload-actions { display:flex; justify-content:flex-end; gap:8px; margin-top:12px; }.inline-error { color:#b42318; font-size:10px; }
      .documents-card { overflow:hidden; }.documents-header { padding:16px 16px 12px; }.documents-header h2 { font-size:16px; }.result-count { display:inline-grid; place-items:center; min-width:21px; height:20px; margin-left:4px; padding:0 5px; border-radius:99px; color:#5a50c4; background:#eeecff; font-size:9px; vertical-align:2px; }.refresh-button { min-height:32px; }.filters { display:flex; align-items:center; flex-wrap:wrap; gap:7px; padding:0 16px 13px; }.filters select { height:32px; padding:0 8px; border:1px solid #e5e7ee; border-radius:8px; color:#555b6d; background:#fff; font:inherit; font-size:9px; }.search-box { display:flex; align-items:center; flex:1 1 170px; height:32px; gap:6px; padding:0 8px; border:1px solid #e5e7ee; border-radius:8px; color:#858b9b; }.search-box>span { font-size:16px; }.search-box input { flex:1; min-width:0; border:0; outline:0; color:#44495a; font:inherit; font-size:9px; }.search-box button { display:grid; place-items:center; width:20px; height:20px; border:0; color:#777d8c; background:transparent; }.search-box button .material-symbols-outlined { font-size:14px; }.clear-filters { height:30px; padding:0 5px; border:0; color:#6459d2; background:transparent; font-size:9px; }.clear-filters:disabled { opacity:.4; }
      .table-scroll { overflow:auto; }table { width:100%; border-collapse:collapse; white-space:nowrap; }th { padding:9px 12px; border-top:1px solid #f0f1f5; border-bottom:1px solid #eceef3; color:#858b9a; background:#fafbfc; font-size:8px; font-weight:700; text-align:left; text-transform:uppercase; letter-spacing:.05em; }td { padding:10px 12px; border-bottom:1px solid #f0f1f5; color:#585e70; font-size:9px; }tbody tr:hover { background:#fcfcff; }.document-link { display:flex; align-items:center; gap:8px; max-width:245px; padding:0; border:0; color:inherit; background:transparent; text-align:left; }.document-link>span:last-child { display:flex; flex-direction:column; min-width:0; gap:3px; }.document-link strong,.document-link small { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }.document-link strong { color:#3c4154; font-size:9px; }.document-link small,.sub-cell { color:#9297a5; font-size:8px; }.sub-cell { display:block; margin-top:3px; }.status-badge,.approval-badge { display:inline-flex; align-items:center; gap:5px; padding:5px 7px; border-radius:99px; font-size:8px; font-weight:700; }.status-badge i { width:5px; height:5px; border-radius:50%; background:currentColor; }.processing-ready { color:#14794e; background:#e6f7ee; }.processing-processing,.processing-queued { color:#236fa8; background:#e8f4fc; }.processing-failed { color:#b43e38; background:#fff0ef; }.processing-cancelled { color:#727888; background:#f0f1f4; }.approval-approved { color:#14794e; background:#e6f7ee; }.approval-draft { color:#68627d; background:#f1eff8; }.approval-pending_approval { color:#98610c; background:#fff5dc; }.approval-archived { color:#737989; background:#f0f1f4; }.row-actions { display:flex; gap:3px; }.row-actions button { display:grid; place-items:center; width:27px; height:27px; border:0; border-radius:7px; color:#777d8d; background:transparent; }.row-actions button:hover { color:#5044d1; background:#f0efff; }.row-actions .material-symbols-outlined { font-size:16px; }
      .table-message { display:flex; align-items:center; justify-content:center; gap:10px; min-height:128px; padding:18px; color:#7e8495; font-size:10px; text-align:left; }.table-message>.material-symbols-outlined { color:#8278d9; font-size:22px; }.table-message strong { color:#454a5d; font-size:11px; }.table-message p { margin:4px 0 0; color:#858b9a; }.error-box { color:#a03a35; }.error-box>.material-symbols-outlined { color:#bd4c45; }.error-box .secondary-button { margin-top:8px; }.pagination { display:flex; align-items:center; justify-content:space-between; padding:10px 15px; border-top:1px solid #eff0f4; color:#818797; font-size:9px; }.pagination>div { display:flex; align-items:center; gap:9px; }.pagination button { display:grid; place-items:center; width:27px; height:27px; border:1px solid #e5e7ee; border-radius:7px; color:#63697a; background:#fff; }.pagination button:disabled { opacity:.4; }
      .access-denied { display:flex; flex-direction:column; align-items:center; padding:38px; border:1px solid #eceef4; border-radius:15px; background:#fff; color:#717789; text-align:center; }.access-denied>.material-symbols-outlined { color:#bd4c45; font-size:28px; }.access-denied strong { margin-top:8px; color:#3d4255; font-size:13px; }.access-denied p { font-size:10px; }
      .toast { position:fixed; right:22px; bottom:24px; z-index:20; display:flex; align-items:center; gap:8px; max-width:min(450px,calc(100vw - 32px)); padding:11px 13px; border:1px solid #ccebdd; border-radius:11px; color:#126d48; background:#f5fcf8; box-shadow:0 8px 28px #19244322; font-size:10px; }.toast-error { border-color:#f1d4d1; color:#a13731; background:#fff8f7; }.toast>button { display:grid; place-items:center; margin-left:auto; border:0; color:inherit; background:transparent; }.toast .material-symbols-outlined { font-size:17px; }
      .drawer-backdrop { position:fixed; inset:0; z-index:15; display:flex; justify-content:flex-end; background:#171b2b73; }.details-drawer { display:flex; flex-direction:column; width:min(520px,100%); height:100%; overflow:auto; background:#fff; box-shadow:-10px 0 35px #12172922; }.details-drawer>header { position:sticky; top:0; z-index:1; display:flex; align-items:flex-start; justify-content:space-between; gap:10px; padding:17px; border-bottom:1px solid #eceef4; background:#fff; }.details-drawer header h2 { margin:4px 0 0; color:#303549; font-size:17px; }.drawer-content { display:flex; flex-direction:column; gap:17px; padding:15px 17px 28px; }.detail-badges { display:flex; gap:7px; }.detail-section h3 { margin:0 0 10px; color:#41465a; font-size:11px; }.detail-section dl { display:flex; flex-direction:column; gap:0; margin:0; border:1px solid #eceef3; border-radius:10px; }.detail-section dl>div { display:grid; grid-template-columns:120px 1fr; gap:10px; padding:8px 10px; border-bottom:1px solid #f0f1f5; }.detail-section dl>div:last-child { border:0; }.detail-section dt { color:#8a90a0; font-size:9px; }.detail-section dd { overflow-wrap:anywhere; margin:0; color:#494e61; font-size:9px; }.pipeline { display:flex; flex-direction:column; gap:0; margin:0; padding:0; list-style:none; }.pipeline li { position:relative; display:flex; gap:9px; min-height:48px; }.pipeline li:not(:last-child):before { position:absolute; top:22px; bottom:-1px; left:10px; width:1px; background:#e5e7ee; content:''; }.pipeline-icon { position:relative; z-index:1; display:grid; place-items:center; width:21px; height:21px; flex:0 0 21px; border-radius:50%; color:#8c91a0; background:#f0f1f4; font-size:13px!important; }.pipeline-completed .pipeline-icon { color:#168255; background:#e4f7ed; }.pipeline-in_progress .pipeline-icon { color:#256fa8; background:#e7f3fc; }.pipeline-failed .pipeline-icon { color:#b43e38; background:#fff0ef; }.pipeline li>div { display:flex; flex-direction:column; gap:3px; padding:2px 0 8px; }.pipeline li strong { color:#4b5061; font-size:9px; }.pipeline li small { color:#858b9b; font-size:8px; }.pipeline li p { margin:2px 0; color:#a43c36; font-size:8px; }.pipeline-note { display:block; margin-top:4px; color:#969baa; font-size:8px; }.metric-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:7px; }.metric-grid>div { display:flex; flex-direction:column; gap:4px; padding:10px; border:1px solid #eceef4; border-radius:9px; }.metric-grid strong { color:#41465a; font-size:14px; }.metric-grid small { color:#888e9d; font-size:8px; }.drawer-error { padding:11px; border:1px solid #f0d5d2; border-radius:10px; color:#9c3c37; background:#fff8f7; }.drawer-error strong { font-size:10px; }.drawer-error p { margin:5px 0; font-size:9px; }.drawer-error small { color:#8d6663; font-size:8px; }.drawer-actions { display:flex; flex-wrap:wrap; gap:8px; }.spin { animation:spin 1.2s linear infinite; }@keyframes spin { to { transform:rotate(360deg); } }
      @media(max-width:760px) { .page-header { align-items:flex-start; flex-direction:column; }.summary-grid { grid-template-columns:repeat(2,minmax(0,1fr)); }.metadata-grid { grid-template-columns:repeat(2,minmax(0,1fr)); }.health-banner { flex-wrap:wrap; }.health-detail { flex-basis:100%; margin-left:17px; }.filters select { flex:1 1 130px; }.table-scroll table { min-width:870px; } }
      @media(max-width:440px) { .summary-card { gap:8px; padding:10px; }.summary-icon { width:31px; height:31px; flex-basis:31px; }.summary-card strong { font-size:17px; }.metadata-grid { grid-template-columns:1fr 1fr; }.upload-actions { flex-wrap:wrap; }.upload-actions button { flex:1; }.upload-row { align-items:flex-start; }.mini-status { white-space:normal; text-align:right; }.documents-header { align-items:flex-start; }.refresh-button { padding:0 8px; }.page-header p { line-height:1.45; } }
    `]
})
export class PolicyManagementPage implements OnInit, OnDestroy {
    readonly Math = Math;
    readonly pageSize = 10;
    readonly maxBytes = 10 * 1024 * 1024;
    readonly policyTypes = ['GENERAL', 'ANNUAL_LEAVE', 'SICK_LEAVE', 'MATERNITY_LEAVE', 'UNPAID_LEAVE', 'OTHER'];
    readonly metadataForm = this.formBuilder.group({
        title: ['', [Validators.required, Validators.maxLength(250)]],
        policyType: ['GENERAL', Validators.required],
        version: ['', [Validators.required, Validators.maxLength(50)]],
        effectiveFrom: [''],
        effectiveTo: [''],
    });
    canManage = false;
    uploadPanelOpen = false;
    dragging = false;
    uploads: PendingUpload[] = [];
    documents: PolicyDocument[] = [];
    counts: { total: number; ready: number; processing: number; failed: number } | null = null;
    health: PolicyKnowledgeHealth | null = null;
    healthError = '';
    healthLoading = false;
    loading = false;
    detailLoading = false;
    selectedDocument: PolicyDocument | null = null;
    listError = '';
    uploadError = '';
    toastMessage = '';
    toastError = false;
    search = '';
    processingStatus = '';
    approvalStatus = '';
    policyType = '';
    page = 0;
    total: number | null = null;
    totalPages = 1;
    private toastTimer?: ReturnType<typeof setTimeout>;

    constructor(private formBuilder: FormBuilder, private api: PolicyIngestionService, auth: AuthService) {
        const role = auth.getUser()?.role;
        this.canManage = role === 'HR' || role === 'ADMIN';
    }

    ngOnInit(): void {
        if (!this.canManage) return;
        this.loadDocuments();
        this.loadHealth();
    }

    ngOnDestroy(): void {
        this.uploads.forEach(item => item.subscription?.unsubscribe());
        if (this.toastTimer) clearTimeout(this.toastTimer);
    }

    get hasActiveUpload(): boolean { return this.uploads.some(item => item.status === 'UPLOADING'); }
    get hasQueuedUpload(): boolean { return this.uploads.some(item => item.status === 'QUEUED'); }
    get hasFilters(): boolean { return !!(this.search || this.processingStatus || this.approvalStatus || this.policyType); }
    get uploadPrerequisiteMessage(): string {
        if (this.healthError) return this.healthError;
        if (!this.health) return '';
        if (!this.health.pgvectorAvailable) return 'Uploads cannot be indexed because the connected PostgreSQL database does not have the pgvector extension enabled.';
        if (!this.health.embeddingConfigured) return 'Uploads cannot be processed because the embedding model is not configured. Set AI_ENABLED=true, AI_CHAT_PROVIDER=google-genai, AI_EMBEDDING_PROVIDER=openai, GOOGLE_API_KEY, and OPENAI_EMBEDDING_API_KEY, then restart leave-service.';
        return '';
    }

    onDragOver(event: DragEvent): void { event.preventDefault(); this.dragging = true; }
    onDrop(event: DragEvent): void {
        event.preventDefault();
        this.dragging = false;
        this.addFiles(Array.from(event.dataTransfer?.files ?? []));
    }
    onFilesSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        this.addFiles(Array.from(input.files ?? []));
        input.value = '';
    }

    addFiles(files: File[]): void {
        this.uploadError = '';
        for (const file of files) {
            const extension = file.name.toLowerCase().split('.').pop();
            if (extension !== 'pdf' && extension !== 'docx') {
                this.uploadError = `${file.name}: only PDF and DOCX files are accepted by this screen.`;
                continue;
            }
            if (file.size > this.maxBytes) {
                this.uploadError = `${file.name}: file exceeds the 10 MB server limit.`;
                continue;
            }
            if (this.uploads.some(item => item.file.name === file.name && item.file.size === file.size && item.status !== 'CANCELLED')) {
                this.uploadError = `${file.name}: this file is already in the upload list.`;
                continue;
            }
            this.uploads.push({ id: crypto.randomUUID(), file, progress: 0, status: 'QUEUED' });
        }
    }

    startUploads(): void {
        if (this.metadataForm.invalid || this.hasActiveUpload) return;
        if (this.uploadPrerequisiteMessage) {
            this.uploadError = this.uploadPrerequisiteMessage;
            return;
        }
        this.uploadError = '';
        const metadata = this.metadataForm.getRawValue() as PolicyUploadMetadata;
        const queued = this.uploads.filter(item => item.status === 'QUEUED');
        queued.forEach(item => this.uploadOne(item, metadata));
    }

    private uploadOne(item: PendingUpload, metadata: PolicyUploadMetadata): void {
        item.status = 'UPLOADING';
        item.progress = 0;
        item.subscription = this.api.upload(item.file, metadata).pipe(
            finalize(() => item.subscription = undefined)
        ).subscribe({
            next: event => {
                if (event.type === HttpEventType.UploadProgress) {
                    item.progress = event.total ? Math.round(event.loaded / event.total * 100) : 0;
                } else if (event.type === HttpEventType.Response && event.body) {
                    item.status = 'READY';
                    item.progress = 100;
                    item.message = `Indexed ${event.body.chunksIndexed} chunks. Approval is still required before employee retrieval.`;
                    this.notify(`${item.file.name} uploaded and indexed. Approve it separately before it appears in employee answers.`);
                    this.loadDocuments();
                    this.loadHealth();
                }
            },
            error: error => {
                item.status = 'FAILED';
                item.message = this.errorMessage(error, 'Upload or processing failed. Check the document list for the persisted failure details.');
                this.showToast(item.message || 'Upload failed.', true);
                this.loadDocuments();
            }
        });
    }

    cancelOrRemove(item: PendingUpload): void {
        if (item.status === 'UPLOADING') {
            item.subscription?.unsubscribe();
            item.status = 'CANCELLED';
            item.message = 'Client request cancelled. The server may have already received and processed the document.';
            this.loadDocuments();
        } else {
            this.uploads = this.uploads.filter(upload => upload.id !== item.id);
        }
    }

    clearFinishedUploads(): void {
        if (!this.hasActiveUpload) this.uploads = this.uploads.filter(item => item.status === 'QUEUED');
    }

    loadDocuments(): void {
        if (!this.canManage) return;
        this.loading = true;
        this.listError = '';
        this.api.list({ search: this.search.trim(), processingStatus: this.processingStatus,
            approvalStatus: this.approvalStatus, policyType: this.policyType, page: this.page, size: this.pageSize })
            .pipe(finalize(() => this.loading = false))
            .subscribe({
                next: result => {
                    this.documents = result.documents;
                    this.total = result.total;
                    this.counts = result.counts;
                    this.totalPages = Math.max(1, Math.ceil(result.total / this.pageSize));
                },
                error: error => {
                    this.listError = error.error?.error || 'The admin policy API is unavailable.';
                    this.documents = [];
                    this.total = null;
                }
            });
    }

    loadHealth(): void {
        if (!this.canManage) return;
        this.healthLoading = true;
        this.healthError = '';
        this.api.health().pipe(finalize(() => this.healthLoading = false)).subscribe({
            next: value => this.health = value,
            error: error => {
                this.health = null;
                this.healthError = error.status === 404
                    ? 'Policy ingestion is disabled on this backend. Set AI_ENABLED=true, AI_CHAT_PROVIDER=google-genai, AI_EMBEDDING_PROVIDER=openai, GOOGLE_API_KEY, and OPENAI_EMBEDDING_API_KEY, then restart leave-service.'
                    : this.errorMessage(error, 'Could not check AI backend configuration. Verify the leave-service API is reachable.');
            }
        });
    }

    filtersChanged(): void { this.page = 0; this.loadDocuments(); }
    clearFilters(): void { this.search = ''; this.processingStatus = ''; this.approvalStatus = ''; this.policyType = ''; this.page = 0; this.loadDocuments(); }
    changePage(delta: number): void { this.page += delta; this.loadDocuments(); }

    openDetails(document: PolicyDocument): void {
        this.selectedDocument = document;
        this.detailLoading = true;
        this.api.get(document.id).pipe(finalize(() => this.detailLoading = false)).subscribe({
            next: value => this.selectedDocument = value,
            error: error => this.showToast(error.error?.error || 'Could not load document details.', true)
        });
    }
    closeDetails(): void { this.selectedDocument = null; }

    canApprove(document: PolicyDocument): boolean {
        return document.processingStatus === 'READY' && ['DRAFT', 'PENDING_APPROVAL'].includes(document.approvalStatus);
    }

    approve(document: PolicyDocument): void {
        if (!this.canApprove(document) || !window.confirm(`Approve “${document.title}” for employee AI retrieval?`)) return;
        this.api.approve(document.id).subscribe({
            next: updated => { this.replaceDocument(updated); this.notify('Policy approved. It is eligible for retrieval when its effective dates apply.'); this.loadDocuments(); this.loadHealth(); },
            error: error => this.showToast(error.error?.error || 'Could not approve this policy.', true)
        });
    }

    archive(document: PolicyDocument): void {
        if (document.approvalStatus === 'ARCHIVED' || !window.confirm(`Archive “${document.title}”? It will no longer be eligible for employee AI retrieval.`)) return;
        this.api.archive(document.id).subscribe({
            next: updated => { this.replaceDocument(updated); this.notify('Policy archived.'); this.loadDocuments(); this.loadHealth(); },
            error: error => this.showToast(error.error?.error || 'Could not archive this policy.', true)
        });
    }

    private replaceDocument(updated: PolicyDocument): void {
        this.documents = this.documents.map(document => document.id === updated.id ? updated : document);
        if (this.selectedDocument?.id === updated.id) this.selectedDocument = updated;
    }
    private notify(message: string): void { this.showToast(message, false); }
    private errorMessage(error: any, fallback: string): string {
        const body = error?.error;
        if (typeof body === 'string' && body.trim()) return body;
        return body?.error || body?.message || body?.detail || body?.title ||
            (error?.status ? `Request failed (HTTP ${error.status}). ${fallback}` : fallback);
    }
    private showToast(message: string, isError: boolean): void {
        this.toastMessage = message;
        this.toastError = isError;
        if (this.toastTimer) clearTimeout(this.toastTimer);
        this.toastTimer = setTimeout(() => this.toastMessage = '', 6000);
    }

    policyTypeLabel(value: string): string {
        return value.toLowerCase().split('_').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
    }
    processingLabel(status: string, stage: string): string {
        if (status === 'PROCESSING') return this.pipelineLabel(stage);
        return status.charAt(0) + status.slice(1).toLowerCase();
    }
    approvalLabel(status: string): string { return status === 'PENDING_APPROVAL' ? 'Pending approval' : status.charAt(0) + status.slice(1).toLowerCase(); }
    pipelineLabel(stage: string): string {
        const labels: Record<string, string> = { UPLOADING: 'Uploading', EXTRACTING_TEXT: 'Extracting text', CHUNKING: 'Chunking', INDEXING: 'Embedding & indexing', READY: 'Indexed successfully', FAILED: 'Failed' };
        return labels[stage] || stage;
    }
    pipelineStatusLabel(status: string): string { return status.replace('_', ' ').toLowerCase().replace(/^./, letter => letter.toUpperCase()); }
    pipelineIcon(status: string): string {
        const icons: Record<string, string> = { COMPLETED: 'check_circle', IN_PROGRESS: 'pending', FAILED: 'error', PENDING: 'radio_button_unchecked' };
        return icons[status] || 'help';
    }
    durationLabel(document: PolicyDocument): string {
        if (!document.processingStartedAt || !document.processingCompletedAt) return '—';
        const milliseconds = new Date(document.processingCompletedAt).getTime() - new Date(document.processingStartedAt).getTime();
        if (milliseconds < 0) return '—';
        return milliseconds < 1000 ? `${milliseconds} ms` : `${(milliseconds / 1000).toFixed(1)} s`;
    }
}
