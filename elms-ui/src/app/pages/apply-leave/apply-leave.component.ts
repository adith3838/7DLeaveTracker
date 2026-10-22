import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LeaveService } from '../../services/leave.service';
import { LeaveBalance } from '../../models/api.models';

@Component({
  selector: 'app-apply-leave', standalone: true, imports: [CommonModule, FormsModule],
  template: `
    <div class="apply-page">
      <section class="intro-card"><div class="intro-icon"><span class="material-symbols-outlined">beach_access</span></div><div><small>SELF-SERVICE PORTAL</small><h1>Book your time off</h1><p>Fast review and calendar syncing</p></div></section>
      <form (ngSubmit)="onSubmit()">
        <section class="form-card category-card"><div class="card-heading"><span>LEAVE CATEGORY</span><span class="policy"><span class="material-symbols-outlined">info</span> Policy rules</span></div><label for="leaveType">Leave type <b>*</b></label><div class="select-wrap"><span class="material-symbols-outlined">category</span><select id="leaveType" [(ngModel)]="leaveType" name="leaveType" required><option value="" disabled>Select leave type</option><option value="PLANNED">Planned leave</option><option value="SICK">Sick leave</option><option value="CASUAL">Casual leave</option><option value="UNPAID">Unpaid leave</option></select></div></section>
        <section class="form-card schedule-card"><div class="card-heading"><span>DATES &amp; SCHEDULE</span><span class="standard">Standard 8h</span></div><div class="date-grid"><label>Start date<input type="date" [(ngModel)]="startDate" name="startDate" [min]="today" required></label><label>End date<input type="date" [(ngModel)]="endDate" name="endDate" [min]="startDate || today" required></label></div><div class="duration"><span class="duration-icon material-symbols-outlined">calendar_month</span><div><small>CALCULATED DURATION</small><strong>{{ workingDays }} <span>Working {{ workingDays === 1 ? 'day' : 'days' }}</span></strong><p>Excluding Saturdays and Sundays</p></div></div></section>
        <section class="form-card balance-card"><div class="balance-heading"><span class="material-symbols-outlined">pie_chart</span><strong>Balance impact preview</strong><span class="eligible" [class.not-eligible]="remainingBalance < 0">{{ remainingBalance < 0 ? 'Review balance' : 'Eligible' }}</span></div><div class="balance-preview"><div><small>Current balance</small><strong>{{ currentBalance }} days</strong></div><div><small>After approval</small><strong>{{ remainingBalance }} days</strong></div></div><p class="balance-note"><span class="material-symbols-outlined">verified</span>{{ remainingBalance < 0 ? 'This request exceeds your remaining balance.' : 'Your available balance will update after approval.' }}</p></section>
        <section class="form-card reason-card"><label for="reason">Reason for leave <b>*</b><small>{{ reason.length }}/250</small></label><textarea id="reason" name="reason" [(ngModel)]="reason" maxlength="250" rows="3" placeholder="e.g. Annual family travel..." required></textarea></section>
        <section class="form-card upload-card"><div class="upload-heading"><span class="material-symbols-outlined">attach_file</span><strong>Supporting documents</strong><small>Optional</small></div><label class="upload-zone"><input type="file" accept=".pdf,.png,.jpg,.jpeg" (change)="onFile($event)"><span class="upload-icon material-symbols-outlined">cloud_upload</span><strong>{{ selectedFile || 'Upload medical slips or itinerary' }}</strong><small>PDF, PNG or JPG up to 10MB</small></label></section>
        <p class="message error" *ngIf="error">{{ error }}</p><p class="message success" *ngIf="success">{{ success }}</p>
        <button class="submit-button" type="submit" [disabled]="loading || !leaveType || !startDate || !endDate || !reason.trim()"><span>{{ loading ? 'Submitting…' : 'Submit leave request' }}</span><span class="material-symbols-outlined">arrow_forward</span></button>
        <button class="reset-button" type="button" (click)="cancel()"><span class="material-symbols-outlined">restart_alt</span> Cancel / Reset</button>
      </form>
    </div>
  `,
  styles: [`
    .apply-page { display:flex; flex-direction:column; gap:14px; padding-bottom:8px; }.intro-card,.form-card { border-radius:16px; background:#fff; box-shadow:0 2px 8px #15274a08; }.intro-card { display:flex; align-items:center; gap:13px; padding:15px; background:#eff4ff; }.intro-icon { display:grid; place-items:center; width:48px; height:48px; flex:0 0 48px; border-radius:14px; color:var(--primary); background:#e2dfff; }.intro-icon span { font-size:26px; }.intro-card small { color:var(--primary); font-size:9px; font-weight:700; letter-spacing:.08em; }.intro-card h1 { margin:3px 0; font-size:17px; letter-spacing:-.03em; }.intro-card p { margin:0; color:var(--muted); font-size:10px; }
    form { display:flex; flex-direction:column; gap:13px; }.form-card { padding:15px; }.card-heading { display:flex; align-items:center; justify-content:space-between; margin-bottom:13px; color:var(--muted); font-size:9px; font-weight:700; letter-spacing:.08em; }.policy { display:flex; align-items:center; gap:3px; color:var(--primary); font-size:10px; font-weight:500; text-transform:none; letter-spacing:0; }.policy span { font-size:14px; }.form-card label { display:block; color:var(--ink-2); font-size:11px; font-weight:600; }.form-card label b { color:#ba1a1a; }.select-wrap { position:relative; margin-top:7px; }.select-wrap>span { position:absolute; top:13px; left:12px; color:var(--ink-2); font-size:19px; pointer-events:none; }.select-wrap select,.date-grid input,.reason-card textarea { width:100%; min-height:46px; margin-top:7px; padding:0 12px; border:1px solid transparent; border-radius:10px; outline:none; color:var(--ink); background:#eff4ff; font-size:12px; }.select-wrap select { padding-left:40px; appearance:auto; }.select-wrap select:focus,.date-grid input:focus,.reason-card textarea:focus { border-color:var(--primary-bright); box-shadow:0 0 0 3px #4f46e51c; background:#fff; }
    .standard { padding:5px 8px; border-radius:99px; color:#00714d; background:#d9fbe9; text-transform:none; letter-spacing:0; }.date-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }.date-grid input { display:block; padding:0 9px; color-scheme:light; }.duration { display:flex; align-items:center; gap:11px; margin-top:15px; padding:12px; border-radius:13px; background:#dce9ff; }.duration-icon { display:grid; place-items:center; width:38px; height:38px; flex:0 0 38px; border-radius:50%; color:white; background:var(--primary); font-size:20px; }.duration div { display:flex; flex-direction:column; gap:3px; }.duration small { color:var(--primary); font-size:8px; font-weight:700; letter-spacing:.07em; }.duration strong { font-size:15px; }.duration strong span { color:var(--ink-2); font-size:11px; font-weight:400; }.duration p { margin:0; color:var(--muted); font-size:9px; }
    .balance-heading { display:flex; align-items:center; gap:7px; }.balance-heading>.material-symbols-outlined { color:var(--green); font-size:19px; }.balance-heading strong { flex:1; font-size:12px; }.eligible { padding:5px 9px; border-radius:99px; color:#065f46; background:#d9fbe9; font-size:9px; font-weight:700; }.eligible.not-eligible { color:#991b1b; background:#fee4e2; }.balance-preview { display:grid; grid-template-columns:1fr 1fr; gap:9px; margin-top:13px; }.balance-preview div { display:flex; flex-direction:column; gap:4px; padding:10px; border-radius:9px; background:#eff4ff; }.balance-preview small { color:var(--muted); font-size:9px; }.balance-preview strong { font-size:14px; }.balance-preview div+div strong { color:var(--primary); }.balance-note { display:flex; align-items:flex-start; gap:6px; margin:10px 0 0; padding:9px; border-radius:9px; color:#006c49; background:#d9fbe9; font-size:10px; line-height:1.4; }.balance-note span { flex:0 0 16px; font-size:15px; }
    .reason-card label { display:flex; justify-content:space-between; }.reason-card label small,.upload-heading small { color:var(--muted); font-size:9px; font-weight:400; }.reason-card textarea { display:block; min-height:86px; padding:11px; resize:vertical; }.upload-heading { display:flex; align-items:center; gap:7px; margin-bottom:11px; }.upload-heading .material-symbols-outlined { font-size:18px; color:var(--ink-2); }.upload-heading strong { flex:1; font-size:11px; }.upload-zone { display:flex!important; flex-direction:column; align-items:center; justify-content:center; gap:5px; min-height:94px; padding:12px; border-radius:12px; background:#eff4ff; text-align:center; cursor:pointer; }.upload-zone input { display:none; }.upload-icon { display:grid; place-items:center; width:34px; height:34px; border-radius:50%; color:var(--primary); background:#dce9ff; }.upload-zone strong { max-width:100%; overflow:hidden; font-size:10px; text-overflow:ellipsis; white-space:nowrap; }.upload-zone small { color:var(--muted); font-size:9px; }.submit-button,.reset-button { display:flex; align-items:center; justify-content:center; gap:8px; width:100%; min-height:48px; border:0; border-radius:12px; font-size:12px; font-weight:700; cursor:pointer; }.submit-button { margin-top:2px; color:#fff; background:linear-gradient(100deg,#0787c4,#0ea5e9); box-shadow:0 6px 18px #0284c755; }.submit-button:disabled { opacity:.55; cursor:not-allowed; }.submit-button span:last-child { font-size:19px; }.reset-button { color:var(--primary); background:#e5eeff; }.reset-button .material-symbols-outlined { font-size:17px; }.message { margin:0; padding:10px 12px; border-radius:10px; font-size:11px; }.error { color:#991b1b; background:#fee4e2; }.success { color:#065f46; background:#d9fbe9; }
  `]
})
export class ApplyLeaveComponent {
  leaveType = '';
  startDate = '';
  endDate = '';
  reason = '';
  error = '';
  success = '';
  loading = false;
  selectedFile = '';
  balances: LeaveBalance[] = [];
  today = new Date().toISOString().slice(0, 10);
  constructor(private leaveService: LeaveService, private router: Router) { this.leaveService.getBalance().subscribe({ next: value => this.balances = value, error: () => this.balances = [] }); }
  get workingDays(): number {
    if (!this.startDate || !this.endDate || this.endDate < this.startDate) return 0;
    let count = 0; const current = new Date(`${this.startDate}T00:00:00`); const end = new Date(`${this.endDate}T00:00:00`);
    while (current <= end) { if (current.getDay() !== 0 && current.getDay() !== 6) count++; current.setDate(current.getDate() + 1); }
    return count;
  }
  get currentBalance(): number { return this.balances.find(balance => balance.leaveType === this.leaveType)?.remainingBalance ?? 0; }
  get remainingBalance(): number { return this.leaveType === 'UNPAID' ? this.currentBalance : this.currentBalance - this.workingDays; }
  onFile(event: Event): void { const file = (event.target as HTMLInputElement).files?.[0]; this.selectedFile = file?.name ?? ''; }
  onSubmit(): void {
    this.loading = true; this.error = ''; this.success = '';
    this.leaveService.applyLeave({ startDate: this.startDate, endDate: this.endDate, leaveType: this.leaveType as 'PLANNED' | 'SICK' | 'CASUAL' | 'UNPAID', reason: this.reason.trim() }).subscribe({
      next: () => { this.success = 'Leave request submitted successfully.'; this.loading = false; setTimeout(() => this.router.navigate(['/my-leaves']), 1000); },
      error: err => { this.error = err.error?.error || 'Could not submit your request. Please try again.'; this.loading = false; }
    });
  }
  cancel(): void { this.leaveType = ''; this.startDate = ''; this.endDate = ''; this.reason = ''; this.selectedFile = ''; this.error = ''; this.success = ''; }
}
