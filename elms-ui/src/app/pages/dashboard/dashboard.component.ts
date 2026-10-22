import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LeaveService } from '../../services/leave.service';
import { Holiday, LeaveBalance, LeaveResponse, User } from '../../models/api.models';

@Component({
    selector: 'app-dashboard', standalone: true, imports: [CommonModule, RouterLink],
    template: `
    <div class="dashboard-page">
      <section class="welcome-card">
        <span class="on-duty"><i></i> On duty today</span>
        <span class="hero-icon material-symbols-outlined">beach_access</span>
        <h1>Welcome back, {{ firstName }}</h1>
        <p>Your time away, made easy.</p>
        <div class="welcome-meta"><span><span class="material-symbols-outlined">verified_user</span> Allowance year {{ currentYear }}</span><strong>{{ totalAvailable }} days available</strong></div>
      </section>

      <section class="section-block">
        <div class="section-title"><div><span class="material-symbols-outlined">donut_small</span><h2>Time off balances</h2></div><small>Updated today</small></div>
        <div class="featured-balance card" *ngIf="balances.length">
          <div class="ring" [style.--progress]="progress(balances[0])"><strong>{{ balances[0].remainingBalance }}</strong><small>days</small></div>
          <div class="featured-copy"><h3>{{ label(balances[0].leaveType) }}</h3><p>Annual relaxation &amp; travel entitlement</p><div class="progress"><i [style.width.%]="progressValue(balances[0])"></i></div></div>
          <div class="available"><strong>{{ balances[0].remainingBalance }}</strong><span>available</span></div>
        </div>
        <div class="balance-grid" *ngIf="balances.length > 1">
          <article class="mini-balance card" *ngFor="let balance of balances.slice(1)">
            <div class="mini-icon" [ngClass]="typeClass(balance.leaveType)"><span class="material-symbols-outlined">{{ balance.leaveType === 'SICK' ? 'healing' : balance.leaveType === 'CASUAL' ? 'event_seat' : 'calendar_month' }}</span></div>
            <span class="balance-pill">{{ balance.year }}</span><h3>{{ label(balance.leaveType) }}</h3><p>Remaining balance</p><div class="mini-total"><strong>{{ balance.remainingBalance }}</strong><span>days</span></div>
          </article>
        </div>
        <div class="empty card" *ngIf="!balances.length"><span class="material-symbols-outlined">info</span><p>Your leave balances will appear here.</p></div>
      </section>

      <section class="section-block" *ngIf="holidays.length">
        <div class="section-title"><div><span class="material-symbols-outlined">celebration</span><h2>Upcoming holidays</h2></div></div>
        <div class="holiday-rail"><article class="holiday-card card" *ngFor="let holiday of holidays"><span class="holiday-mark material-symbols-outlined">event</span><small>{{ holiday.date | date:'MMM d' }}</small><h3>{{ holiday.name }}</h3><span class="optional" *ngIf="holiday.isOptional">Optional</span></article></div>
      </section>

      <section class="section-block">
        <div class="section-title"><div><span class="material-symbols-outlined">history</span><h2>Recent activity</h2></div><a routerLink="/my-leaves">View all</a></div>
        <article class="activity-card card" *ngFor="let leave of recentLeaves">
          <div class="activity-top"><div class="activity-symbol" [ngClass]="'symbol-' + leave.status.toLowerCase()"><span class="material-symbols-outlined">{{ leave.leaveType === 'SICK' ? 'medical_services' : leave.leaveType === 'PLANNED' ? 'flight_takeoff' : 'celebration' }}</span></div><div class="activity-copy"><h3>{{ label(leave.leaveType) }}</h3><p>{{ leave.reason || 'Time away request' }}</p></div><span class="status" [ngClass]="'status-' + leave.status.toLowerCase()">{{ leave.status }}</span></div>
          <div class="activity-meta"><span><span class="material-symbols-outlined">date_range</span>{{ leave.startDate | date:'MMM d' }} – {{ leave.endDate | date:'MMM d, yyyy' }}</span><span><span class="material-symbols-outlined">schedule</span>{{ daysBetween(leave.startDate, leave.endDate) }} days</span></div>
        </article>
        <div class="empty card" *ngIf="!recentLeaves.length"><span class="material-symbols-outlined">event_note</span><p>No leave requests yet.</p><a routerLink="/apply-leave">Plan some time off</a></div>
      </section>
    </div>
  `,
    styles: [`
    .dashboard-page { display:flex; flex-direction:column; gap:24px; padding-bottom:10px; }
    .welcome-card { position:relative; overflow:hidden; padding:22px 20px 16px; border-radius:20px; color:#fff; background:linear-gradient(130deg,#3525cd 0%,#4f46e5 58%,#7c6cf5 100%); box-shadow:0 12px 28px #4f46e52e; }
    .welcome-card:after { content:''; position:absolute; width:180px; height:180px; right:-76px; top:-60px; border-radius:50%; background:#ffffff14; box-shadow:0 0 0 28px #ffffff08; }
    .on-duty { display:inline-flex; align-items:center; gap:7px; padding:6px 10px; border-radius:99px; background:#ffffff24; font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:.06em; }
    .on-duty i { width:7px; height:7px; border-radius:50%; background:#6cf8bb; }
    .hero-icon { position:absolute; right:24px; top:56px; font-size:78px; opacity:.14; }
    h1 { position:relative; z-index:1; margin:17px 0 4px; font-size:23px; letter-spacing:-.04em; }
    .welcome-card>p { position:relative; z-index:1; margin:0; color:#e2dfff; font-size:13px; }
    .welcome-meta { position:relative; z-index:1; display:flex; align-items:center; justify-content:space-between; gap:8px; margin-top:19px; padding-top:14px; border-top:1px solid #ffffff30; font-size:11px; }
    .welcome-meta span { display:flex; align-items:center; gap:5px; color:#f0efff; }.welcome-meta .material-symbols-outlined { font-size:16px; }.welcome-meta strong { border-radius:99px; padding:7px 10px; background:#00714d; white-space:nowrap; }
    .section-block { display:flex; flex-direction:column; gap:12px; }.section-title { display:flex; align-items:center; justify-content:space-between; min-height:26px; }.section-title>div { display:flex; align-items:center; gap:8px; }.section-title .material-symbols-outlined { color:var(--primary-bright); font-size:20px; }.section-title h2 { margin:0; font-size:16px; letter-spacing:-.02em; }.section-title small { color:var(--muted); font-size:10px; text-transform:uppercase; letter-spacing:.05em; }.section-title a { color:var(--primary); font-size:12px; font-weight:600; text-decoration:none; }
    .card { border:1px solid #f0f2f7; border-radius:16px; background:var(--surface); box-shadow:0 2px 8px #15274a08; }.featured-balance { display:flex; align-items:center; gap:13px; padding:16px; }.ring { --progress:70%; display:flex; flex-direction:column; align-items:center; justify-content:center; position:relative; flex:0 0 58px; width:58px; height:58px; border-radius:50%; background:conic-gradient(var(--primary-bright) var(--progress),#e5eeff 0); color:var(--ink); }.ring:before { content:''; position:absolute; inset:5px; border-radius:50%; background:#fff; }.ring strong,.ring small { position:relative; z-index:1; }.ring strong { font-size:16px; }.ring small { font-size:8px; color:var(--muted); }.featured-copy { flex:1; min-width:0; }.featured-copy h3,.mini-balance h3 { margin:0; font-size:14px; }.featured-copy p,.mini-balance p { margin:4px 0 9px; color:var(--muted); font-size:10px; }.progress { width:100%; height:5px; overflow:hidden; border-radius:99px; background:#e5eeff; }.progress i { display:block; height:100%; border-radius:inherit; background:#4f46e5; }.available { display:flex; flex-direction:column; align-items:flex-end; }.available strong { font-size:22px; }.available span { color:var(--muted); font-size:10px; }
    .balance-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; }.mini-balance { position:relative; padding:13px; min-height:143px; }.mini-icon { display:grid; place-items:center; width:31px; height:31px; margin-bottom:12px; border-radius:10px; color:var(--primary); background:#e7e5ff; }.mini-icon .material-symbols-outlined { font-size:18px; }.mini-icon.type-sick { color:#006c49; background:#d9fbe9; }.balance-pill { position:absolute; top:15px; right:12px; color:var(--green); font-size:9px; font-weight:700; }.mini-balance h3 { font-size:12px; }.mini-balance p { margin:4px 0 10px; font-size:10px; }.mini-total { display:flex; align-items:baseline; gap:4px; }.mini-total strong { font-size:21px; }.mini-total span { color:var(--muted); font-size:10px; }
    .holiday-rail { display:flex; gap:10px; overflow-x:auto; padding:0 0 5px; }.holiday-card { position:relative; flex:0 0 175px; min-height:110px; padding:13px; }.holiday-mark { position:absolute; right:12px; top:12px; color:var(--primary-bright); font-size:19px; }.holiday-card small { color:var(--primary); font-size:10px; font-weight:700; }.holiday-card h3 { max-width:125px; margin:11px 0 0; font-size:13px; }.optional { display:inline-block; margin-top:7px; color:var(--amber); font-size:9px; }
    .activity-card { padding:13px; }.activity-top { display:flex; align-items:center; gap:10px; }.activity-symbol { display:grid; place-items:center; flex:0 0 36px; height:36px; border-radius:12px; color:var(--green); background:var(--green-soft); }.activity-symbol .material-symbols-outlined { font-size:19px; }.symbol-pending { color:var(--amber); background:var(--amber-soft); }.symbol-rejected { color:var(--red); background:var(--red-soft); }.activity-copy { flex:1; min-width:0; }.activity-copy h3 { overflow:hidden; margin:0; font-size:12px; text-overflow:ellipsis; white-space:nowrap; }.activity-copy p { overflow:hidden; margin:4px 0 0; color:var(--muted); font-size:10px; text-overflow:ellipsis; white-space:nowrap; }.status { padding:5px 8px; border-radius:99px; font-size:8px; font-weight:700; }.status-approved { color:#065f46; background:#d9fbe9; }.status-pending { color:#92400e; background:#fff4cf; }.status-rejected,.status-cancelled { color:#991b1b; background:#fee4e2; }.activity-meta { display:flex; justify-content:space-between; gap:8px; margin-top:12px; padding:9px; border-radius:9px; color:var(--ink-2); background:#eff4ff; font-size:9px; }.activity-meta span { display:flex; align-items:center; gap:4px; }.activity-meta .material-symbols-outlined { color:var(--primary); font-size:14px; }.empty { display:flex; flex-direction:column; align-items:center; padding:24px; color:var(--muted); text-align:center; }.empty .material-symbols-outlined { color:var(--primary); }.empty p { margin:8px 0; font-size:12px; }.empty a { color:var(--primary); font-size:12px; font-weight:600; text-decoration:none; }
  `]
})
export class DashboardComponent implements OnInit {
    user: User | null = null;
    balances: LeaveBalance[] = [];
    holidays: Holiday[] = [];
    recentLeaves: LeaveResponse[] = [];
    currentYear = new Date().getFullYear();
    constructor(private authService: AuthService, private leaveService: LeaveService) { }
    ngOnInit(): void {
        this.user = this.authService.getUser();
        this.leaveService.getBalance().subscribe({ next: value => this.balances = value, error: () => this.balances = [] });
        this.leaveService.getUpcomingHolidays().subscribe({ next: value => this.holidays = value.slice(0, 6), error: () => this.holidays = [] });
        this.leaveService.getMyLeaves().subscribe({ next: value => this.recentLeaves = value.slice(0, 3), error: () => this.recentLeaves = [] });
    }
    get firstName(): string { return this.user?.name?.split(' ')[0] ?? 'there'; }
    get totalAvailable(): number { return this.balances.reduce((total, balance) => total + balance.remainingBalance, 0); }
    label(value: string): string { return value.toLowerCase().replace(/\b\w/g, character => character.toUpperCase()) + (value === 'PLANNED' ? ' Leave' : ''); }
    typeClass(value: string): string { return `type-${value.toLowerCase()}`; }
    progress(balance: LeaveBalance): string { return `${this.progressValue(balance)}%`; }
    progressValue(balance: LeaveBalance): number { const totals: Record<string, number> = { PLANNED: 20, SICK: 10, CASUAL: 5 }; return Math.min(100, Math.max(0, balance.remainingBalance / (totals[balance.leaveType] ?? Math.max(balance.remainingBalance, 1)) * 100)); }
    daysBetween(start: string, end: string): number { const from = new Date(`${start}T00:00:00`); const to = new Date(`${end}T00:00:00`); return Math.max(1, Math.floor((to.getTime() - from.getTime()) / 86400000) + 1); }
}
