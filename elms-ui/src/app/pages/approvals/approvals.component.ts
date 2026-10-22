import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LeaveService } from '../../services/leave.service';
import { LeaveResponse } from '../../models/api.models';

type ApprovalTab = 'PENDING' | 'APPROVED' | 'TEAM';
@Component({
  selector: 'app-approvals', standalone: true, imports: [CommonModule],
  template: `
    <div class="approvals-page">
      <div class="segments" role="tablist"><button [class.active]="activeTab === 'PENDING'" (click)="activeTab='PENDING'">Pending <b>{{ pending.length }}</b></button><button [class.active]="activeTab === 'APPROVED'" (click)="activeTab='APPROVED'">Approved</button><button [class.active]="activeTab === 'TEAM'" (click)="activeTab='TEAM'">Team off</button></div>
      <section class="calendar-card">
        <div class="calendar-heading"><span class="material-symbols-outlined">calendar_month</span><strong>{{ monthLabel }}</strong><div><button aria-label="Previous month" (click)="shiftMonth(-1)"><span class="material-symbols-outlined">chevron_left</span></button><button aria-label="Next month" (click)="shiftMonth(1)"><span class="material-symbols-outlined">chevron_right</span></button></div></div>
        <div class="calendar-grid"><span class="weekday" *ngFor="let day of weekdays">{{ day }}</span><span class="calendar-day" *ngFor="let day of calendarDays" [class.muted]="!day.current" [class.today]="day.today" [class.has-leave]="day.hasLeave">{{ day.date }}<i *ngIf="day.hasLeave"></i></span></div>
        <div class="team-away"><span class="team-avatars"><i>JD</i><i>ER</i></span><span><b>{{ pending.length || 2 }} teammates away</b><small>Review overlapping team dates</small></span><span class="material-symbols-outlined info">info</span></div>
      </section>
      <div class="list-heading"><div><h1>{{ activeTab === 'PENDING' ? 'Awaiting decision' : activeTab === 'APPROVED' ? 'Approved requests' : 'Team time off' }}</h1><span class="new-count" *ngIf="activeTab === 'PENDING'">{{ pending.length }} new</span></div><button (click)="activeTab='APPROVED'">History</button></div>
      <article class="approval-card" *ngFor="let leave of visibleLeaves">
        <div class="person-row"><span class="person-avatar" [ngClass]="avatarClass(leave.id)">{{ initials(leave.employeeId) }}</span><div class="person-copy"><h2>Employee #{{ leave.employeeId }}</h2><p>Team member · Leave request</p></div><span class="leave-type" [ngClass]="'type-' + leave.leaveType.toLowerCase()">{{ label(leave.leaveType) }}</span></div>
        <div class="request-details"><div class="detail-row"><span class="material-symbols-outlined">calendar_month</span><b>{{ leave.startDate | date:'MMM d' }} – {{ leave.endDate | date:'MMM d, yyyy' }}</b><span class="days-chip">{{ duration(leave) }} {{ duration(leave) === 1 ? 'day' : 'days' }}</span></div><div class="detail-row" *ngIf="leave.reason"><span class="material-symbols-outlined muted-icon">chat_bubble_outline</span><span class="reason">“{{ leave.reason }}”</span></div><div class="detail-row balance-row"><span class="material-symbols-outlined">account_balance_wallet</span><span>Request #{{ leave.id }} · {{ leave.status | titlecase }}</span></div></div>
        <div class="actions" *ngIf="leave.status === 'PENDING'"><button class="reject" [disabled]="busyId === leave.id" (click)="reject(leave.id)"><span class="material-symbols-outlined">close</span> Reject</button><button class="approve" [disabled]="busyId === leave.id" (click)="approve(leave.id)"><span class="material-symbols-outlined">check</span> Approve</button></div>
      </article>
      <div class="empty-state" *ngIf="!visibleLeaves.length"><span class="material-symbols-outlined">event_available</span><h2>{{ activeTab === 'PENDING' ? 'All caught up' : 'Nothing to show yet' }}</h2><p>{{ activeTab === 'PENDING' ? 'New requests will appear here.' : 'Requests in this view will appear here.' }}</p></div>
      <p class="error-message" *ngIf="error">{{ error }}</p>
    </div>
  `,
  styles: [`
    .approvals-page { display:flex; flex-direction:column; gap:15px; padding-bottom:8px; }.segments { display:grid; grid-template-columns:repeat(3,1fr); gap:3px; padding:4px; border-radius:13px; background:#dce9ff; }.segments button { min-height:36px; border:0; border-radius:9px; color:#4c5265; background:transparent; font-size:10px; font-weight:600; }.segments button.active { color:var(--ink); background:#fff; box-shadow:0 1px 4px #1d29471a; }.segments b { margin-left:2px; font-size:9px; }
    .calendar-card { padding:15px; border:1px solid #f0f2f7; border-radius:17px; background:#fff; box-shadow:0 2px 8px #15274a08; }.calendar-heading { display:flex; align-items:center; gap:7px; margin-bottom:14px; }.calendar-heading>.material-symbols-outlined { color:var(--primary); font-size:20px; }.calendar-heading strong { flex:1; font-size:15px; }.calendar-heading div { display:flex; gap:9px; }.calendar-heading button { display:grid; place-items:center; width:26px; height:26px; border:0; border-radius:50%; color:var(--ink); background:transparent; }.calendar-heading button .material-symbols-outlined { font-size:19px; }.calendar-grid { display:grid; grid-template-columns:repeat(7,1fr); justify-items:center; row-gap:4px; }.weekday { padding:3px 0 6px; color:var(--muted); font-size:9px; font-weight:700; }.calendar-day { position:relative; display:grid; place-items:center; width:32px; height:31px; border-radius:9px; color:var(--ink); font-size:10px; }.calendar-day.muted { color:#b2b6c4; }.calendar-day.today { color:#fff; background:#4f46e5; }.calendar-day.has-leave:after { content:''; position:absolute; bottom:1px; width:5px; height:5px; border-radius:50%; background:#ef4444; }.calendar-day.today.has-leave:after { background:#fff; }.team-away { display:flex; align-items:center; gap:8px; margin-top:12px; padding:9px; border-radius:10px; background:#eff4ff; }.team-avatars { display:flex; }.team-avatars i { display:grid; place-items:center; width:25px; height:25px; border:2px solid white; border-radius:50%; color:#fff; background:#69988c; font-size:7px; font-style:normal; font-weight:700; }.team-avatars i+i { margin-left:-7px; background:#8e6e8e; }.team-away>span:nth-child(2) { display:flex; flex:1; flex-direction:column; gap:3px; }.team-away b { font-size:10px; }.team-away small { color:var(--muted); font-size:9px; }.team-away .info { color:var(--muted); font-size:16px; }
    .list-heading { display:flex; align-items:center; justify-content:space-between; margin-top:3px; }.list-heading>div { display:flex; align-items:center; gap:8px; }.list-heading h1 { margin:0; font-size:16px; letter-spacing:-.03em; }.list-heading button { border:0; color:var(--primary); background:none; font-size:11px; font-weight:600; }.new-count { padding:4px 8px; border-radius:99px; color:var(--primary); background:#e7e5ff; font-size:9px; font-weight:700; }
    .approval-card { padding:14px; border:1px solid #f0f2f7; border-radius:16px; background:#fff; box-shadow:0 2px 8px #15274a08; }.person-row { display:flex; align-items:center; gap:9px; }.person-avatar { display:grid; place-items:center; width:39px; height:39px; flex:0 0 39px; border:2px solid #fff; border-radius:50%; color:#fff; background:linear-gradient(145deg,#30485c,#90aa9a); box-shadow:0 2px 4px #17243b22; font-size:10px; font-weight:700; }.avatar-1 { background:linear-gradient(145deg,#95594d,#e4a275); }.avatar-2 { background:linear-gradient(145deg,#354d6c,#859fc6); }.person-copy { flex:1; min-width:0; }.person-copy h2 { margin:0; font-size:14px; }.person-copy p { overflow:hidden; margin:3px 0 0; color:var(--muted); font-size:9px; text-overflow:ellipsis; white-space:nowrap; }.leave-type { max-width:115px; overflow:hidden; padding:6px 9px; border-radius:99px; color:#3221b5; background:#e7e5ff; font-size:9px; font-weight:700; text-overflow:ellipsis; white-space:nowrap; }.type-sick { color:#b42318; background:#fee4e2; }.type-casual { color:#854d0e; background:#ffedd5; }.request-details { display:flex; flex-direction:column; gap:9px; margin-top:12px; padding:10px; border-radius:11px; background:#eff4ff; }.detail-row { display:flex; align-items:center; gap:6px; min-width:0; color:var(--ink-2); font-size:10px; }.detail-row>.material-symbols-outlined { color:var(--primary); font-size:16px; }.detail-row b { flex:1; font-size:10px; }.days-chip { padding:4px 7px; border-radius:99px; color:#fff; background:#4f46e5; font-size:8px; font-weight:700; white-space:nowrap; }.detail-row .muted-icon { color:#777587; }.reason { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }.balance-row { color:#006c49; font-size:9px; }.balance-row>.material-symbols-outlined { color:#00805a; font-size:15px; }.actions { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:11px; }.actions button { display:flex; align-items:center; justify-content:center; gap:5px; min-height:44px; border:0; border-radius:12px; font-size:11px; font-weight:700; }.actions .material-symbols-outlined { font-size:17px; }.reject { color:#b42318; background:#fee0dd; }.approve { color:#fff; background:#00714d; box-shadow:0 3px 7px #00714d2b; }.actions button:disabled { opacity:.5; }.empty-state { display:flex; flex-direction:column; align-items:center; padding:34px 12px; color:var(--muted); text-align:center; }.empty-state .material-symbols-outlined { color:var(--primary); font-size:30px; }.empty-state h2 { margin:10px 0 4px; color:var(--ink); font-size:15px; }.empty-state p { margin:0; font-size:11px; }.error-message { padding:10px; border-radius:9px; color:#991b1b; background:#fee4e2; font-size:11px; }
  `]
})
export class ApprovalsComponent implements OnInit {
  pending: LeaveResponse[] = [];
  activeTab: ApprovalTab = 'PENDING';
  busyId: number | null = null;
  error = '';
  month = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  weekdays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  constructor(private leaveService: LeaveService) { }
  ngOnInit(): void { this.loadPending(); }
  get monthLabel(): string { return this.month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }); }
  get visibleLeaves(): LeaveResponse[] { return this.pending.filter(leave => this.activeTab === 'PENDING' ? leave.status === 'PENDING' : this.activeTab === 'APPROVED' ? leave.status === 'APPROVED' : false); }
  get calendarDays(): {date:number;current:boolean;today:boolean;hasLeave:boolean}[] {
    const year = this.month.getFullYear(); const monthIndex = this.month.getMonth();
    const first = new Date(year, monthIndex, 1); const offset = (first.getDay() + 6) % 7; const total = Math.ceil((offset + new Date(year, monthIndex + 1, 0).getDate()) / 7) * 7;
    const today = new Date();
    return Array.from({ length: total }, (_, index) => { const date = new Date(year, monthIndex, index - offset + 1); return { date: date.getDate(), current: date.getMonth() === monthIndex, today: date.toDateString() === today.toDateString(), hasLeave: this.pending.some(leave => date >= new Date(`${leave.startDate}T00:00:00`) && date <= new Date(`${leave.endDate}T00:00:00`)) }; });
  }
  shiftMonth(amount: number): void { this.month = new Date(this.month.getFullYear(), this.month.getMonth() + amount, 1); }
  label(type: string): string { const labels: Record<string,string> = { PLANNED:'Planned (Annual)', SICK:'Sick leave', CASUAL:'Casual leave', UNPAID:'Unpaid leave' }; return labels[type] ?? type; }
  initials(id: number): string { return `E${String(id).slice(-1)}`; }
  avatarClass(id: number): string { return `avatar-${id % 3}`; }
  duration(leave: LeaveResponse): number { return Math.max(1, Math.floor((new Date(`${leave.endDate}T00:00:00`).getTime() - new Date(`${leave.startDate}T00:00:00`).getTime()) / 86400000) + 1); }
  approve(id: number): void { this.update(id, true); }
  reject(id: number): void { this.update(id, false); }
  private loadPending(): void { this.leaveService.getPendingLeaves([]).subscribe({ next: value => this.pending = value, error: () => this.error = 'Could not load approval requests.' }); }
  private update(id: number, approve: boolean): void {
    this.busyId = id; this.error = '';
    const request = approve ? this.leaveService.approveLeave(id) : this.leaveService.rejectLeave(id);
    request.subscribe({ next: updated => { this.pending = this.pending.map(leave => leave.id === id ? updated : leave); this.busyId = null; }, error: err => { this.error = err.error?.error || 'Could not update this request.'; this.busyId = null; } });
  }
}
