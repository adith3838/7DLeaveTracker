import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LeaveService } from '../../services/leave.service';
import { LeaveResponse } from '../../models/api.models';
type LeaveFilter = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED';

@Component({
    selector: 'app-my-leaves', standalone: true, imports: [CommonModule],
    template: `
    <div class="history-page">
      <div class="page-intro">
        <small>YOUR TIME OFF</small>
        <h1>My leave requests</h1>
        <p>Keep track of your upcoming and past time away.</p>
      </div>
      <div class="filter-tabs">
        <button *ngFor="let filter of filters" [class.active]="activeFilter === filter" (click)="activeFilter=filter">{{ filter | titlecase }}<span>{{ count(filter) }}</span></button>
      </div>
      <article class="leave-card" *ngFor="let leave of visibleLeaves">
        <div class="leave-head">
          <div class="leave-icon" [ngClass]="'icon-' + leave.status.toLowerCase()">
            <span class="material-symbols-outlined">{{ leave.leaveType === 'SICK' ? 'medical_services' : leave.leaveType === 'PLANNED' ? 'flight_takeoff' : 'celebration' }}</span>
          </div>
          <div class="leave-title">
            <h2>{{ label(leave.leaveType) }}</h2>
            <p>{{ leave.reason || 'Personal time off' }}</p>
          </div>
          <span class="status" [ngClass]="'status-' + leave.status.toLowerCase()">{{ leave.status }}</span>
        </div>
        <div class="leave-meta">
          <span><span class="material-symbols-outlined">date_range</span>{{ leave.startDate | date:'MMM d' }} – {{ leave.endDate | date:'MMM d, yyyy' }}</span>
          <strong>{{ duration(leave) }} {{ duration(leave) === 1 ? 'day' : 'days' }}</strong>
        </div>
        <div class="request-id">Request #{{ leave.id }} <span>Submitted {{ leave.createdAt | date:'MMM d, yyyy' }}</span></div>
      </article>
      <div class="empty" *ngIf="!visibleLeaves.length">
        <span class="material-symbols-outlined">event_note</span>
        <h2>No requests in this view</h2>
        <p>Your leave requests will show up here.</p>
      </div>
    </div>
  `,
    styles: [`
    .history-page { display:flex; flex-direction:column; gap:13px; padding-bottom:10px; }.page-intro { padding:9px 2px 3px; }.page-intro small { color:var(--primary); font-size:9px; font-weight:700; letter-spacing:.11em; }.page-intro h1 { margin:5px 0; font-size:22px; letter-spacing:-.04em; }.page-intro p { margin:0; color:var(--muted); font-size:11px; }.filter-tabs { display:flex; gap:5px; padding:4px; overflow:auto; border-radius:12px; background:#e9effb; }.filter-tabs button { display:flex; align-items:center; gap:5px; min-height:34px; padding:0 10px; border:0; border-radius:9px; color:#687083; background:transparent; font-size:10px; font-weight:600; white-space:nowrap; }.filter-tabs button.active { color:var(--ink); background:#fff; box-shadow:0 1px 4px #15274a12; }.filter-tabs button span { font-size:9px; }.leave-card { padding:14px; border:1px solid #f0f2f7; border-radius:15px; background:#fff; box-shadow:0 2px 8px #15274a08; }.leave-head { display:flex; align-items:center; gap:9px; }.leave-icon { display:grid; place-items:center; flex:0 0 36px; height:36px; border-radius:12px; color:#006c49; background:#d9fbe9; }.leave-icon .material-symbols-outlined { font-size:19px; }.icon-pending { color:#92400e; background:#fff4cf; }.icon-rejected,.icon-cancelled { color:#b42318; background:#fee4e2; }.leave-title { flex:1; min-width:0; }.leave-title h2 { margin:0; font-size:12px; }.leave-title p { overflow:hidden; margin:3px 0 0; color:var(--muted); font-size:10px; text-overflow:ellipsis; white-space:nowrap; }.status { padding:5px 8px; border-radius:99px; font-size:8px; font-weight:700; }.status-pending { color:#92400e; background:#fff4cf; }.status-approved { color:#065f46; background:#d9fbe9; }.status-rejected,.status-cancelled { color:#991b1b; background:#fee4e2; }.leave-meta { display:flex; align-items:center; justify-content:space-between; gap:8px; margin-top:13px; padding:9px; border-radius:9px; color:var(--ink-2); background:#eff4ff; font-size:9px; }.leave-meta>span { display:flex; align-items:center; gap:5px; }.leave-meta .material-symbols-outlined { color:var(--primary); font-size:15px; }.leave-meta strong { white-space:nowrap; }.request-id { display:flex; justify-content:space-between; gap:6px; margin-top:9px; color:var(--muted); font-size:9px; }.empty { display:flex; flex-direction:column; align-items:center; padding:34px 12px; color:var(--muted); text-align:center; }.empty .material-symbols-outlined { color:var(--primary); font-size:30px; }.empty h2 { margin:10px 0 4px; color:var(--ink); font-size:14px; }.empty p { margin:0; font-size:11px; }
  `]
})
export class MyLeavesComponent implements OnInit {
    leaves: LeaveResponse[] = [];
    filters: LeaveFilter[] = ['ALL', 'PENDING', 'APPROVED', 'REJECTED'];
    activeFilter: LeaveFilter = 'ALL';
    constructor(private leaveService: LeaveService) { }
    ngOnInit(): void { this.leaveService.getMyLeaves().subscribe({ next: value => this.leaves = value, error: () => this.leaves = [] }); }
    get visibleLeaves(): LeaveResponse[] { return this.activeFilter === 'ALL' ? this.leaves : this.leaves.filter(leave => leave.status === this.activeFilter); }
    count(filter: LeaveFilter): number { return filter === 'ALL' ? this.leaves.length : this.leaves.filter(leave => leave.status === filter).length; }
    label(type: string): string { const labels: Record<string,string> = { PLANNED:'Planned leave', SICK:'Sick leave', CASUAL:'Casual leave', UNPAID:'Unpaid leave' }; return labels[type] ?? type; }
    duration(leave: LeaveResponse): number { return Math.max(1, Math.floor((new Date(`${leave.endDate}T00:00:00`).getTime() - new Date(`${leave.startDate}T00:00:00`).getTime()) / 86400000) + 1); }
}
