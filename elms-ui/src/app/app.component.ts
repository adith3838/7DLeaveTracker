import { Component } from '@angular/core';
import { NavigationEnd, RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonApp, IonContent, IonIcon, IonLabel, IonTabBar, IonTabButton } from '@ionic/angular/standalone';
import { filter } from 'rxjs';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, IonApp, IonContent, IonIcon, IonLabel, IonTabBar, IonTabButton],
  template: `
    <ion-app>
      <ng-container *ngIf="authService.isLoggedIn(); else publicPage">
        <header class="app-header">
          <a class="brand" routerLink="/dashboard" aria-label="TimeOff dashboard">
            <span class="brand-mark"><span class="material-symbols-outlined">edit_calendar</span></span>
            <span class="brand-copy"><strong>TIMEOFF</strong><span>{{ pageTitle }}</span></span>
          </a>
          <div class="header-actions">
            <span class="avatar" aria-label="Signed-in user">{{ user?.name?.charAt(0) || 'U' }}</span>
            <button class="logout-button" aria-label="Sign out" (click)="logout()"><span class="material-symbols-outlined">logout</span></button>
          </div>
        </header>
        <ion-content [fullscreen]="true" class="page-content"><main class="page-shell"><router-outlet></router-outlet></main></ion-content>
        <ion-tab-bar slot="bottom" class="bottom-tabs">
          <ion-tab-button tab="dashboard" routerLink="/dashboard" routerLinkActive="tab-selected"><ion-icon name="home-outline"></ion-icon><ion-label>Dashboard</ion-label></ion-tab-button>
          <ion-tab-button tab="apply-leave" routerLink="/apply-leave" routerLinkActive="tab-selected"><ion-icon name="calendar-outline"></ion-icon><ion-label>Apply</ion-label></ion-tab-button>
          <ion-tab-button tab="my-leaves" routerLink="/my-leaves" routerLinkActive="tab-selected"><ion-icon name="reader-outline"></ion-icon><ion-label>My Leaves</ion-label></ion-tab-button>
          <ion-tab-button tab="assistant" routerLink="/assistant" routerLinkActive="tab-selected"><ion-icon name="sparkles-outline"></ion-icon><ion-label>Assistant</ion-label></ion-tab-button>
          <ion-tab-button *ngIf="canManagePolicies" tab="admin-policies" routerLink="/admin/ai-policies" routerLinkActive="tab-selected"><ion-icon name="library-outline"></ion-icon><ion-label>Policies</ion-label></ion-tab-button>
          <ion-tab-button *ngIf="canApprove" tab="approvals" routerLink="/approvals" routerLinkActive="tab-selected"><ion-icon name="checkmark-circle-outline"></ion-icon><ion-label>Approvals</ion-label></ion-tab-button>
        </ion-tab-bar>
      </ng-container>
      <ng-template #publicPage><router-outlet></router-outlet></ng-template>
    </ion-app>
  `,
  styles: [`
    :host { display: block; min-height: 100%; }
    ion-app { background: var(--page-bg); }
    .app-header { position: relative; z-index: 3; display:flex; align-items:center; justify-content:space-between; height:68px; padding:max(env(safe-area-inset-top),8px) 18px 0; background:rgba(248,249,255,.97); border-bottom:1px solid #edf0f6; }
    .brand { display:flex; align-items:center; gap:10px; color:var(--ink); text-decoration:none; }
    .brand-mark { display:grid; place-items:center; width:38px; height:38px; border-radius:12px; color:#fff; background:linear-gradient(145deg,#6c5cff,#3828d2); box-shadow:0 5px 12px #4f46e533; }
    .brand-mark .material-symbols-outlined { font-size:21px; }
    .brand-copy { display:flex; flex-direction:column; line-height:1.16; }
    .brand-copy strong { color:var(--primary); font-size:11px; letter-spacing:.12em; }
    .brand-copy span { font-size:18px; font-weight:600; }
    .header-actions { display:flex; align-items:center; gap:14px; }
    .avatar { display:grid; place-items:center; width:36px; height:36px; border-radius:50%; color:#fff; background:linear-gradient(135deg,#365f7d,#87b3a2); font-weight:700; }
    .logout-button { display:grid; place-items:center; border:0; color:var(--ink-2); background:transparent; cursor:pointer; }
    .logout-button .material-symbols-outlined { font-size:21px; }
    .page-content { --background:var(--page-bg); }
    .page-shell { width:min(100%,760px); margin:0 auto; padding:12px 16px 28px; }
    .bottom-tabs { position:relative; width:min(100%,760px); margin:0 auto; padding:5px 6px max(env(safe-area-inset-bottom),7px); border-top:1px solid #edf0f6; border-radius:18px 18px 0 0; background:rgba(250,251,255,.98); box-shadow:0 -6px 22px #1325450a; }
    .bottom-tabs ion-tab-button { --color:#687083; --color-selected:#3525cd; --padding-top:5px; --padding-bottom:3px; min-height:53px; font-size:10px; font-weight:600; }
    .bottom-tabs ion-icon { font-size:22px; }
    @media(min-width:900px) { .page-shell { padding-top:24px; } .app-header { padding-left:max(calc((100vw - 720px)/2),24px); padding-right:max(calc((100vw - 720px)/2),24px); } }
  `]
})
export class AppComponent {
  user = this.authService.getUser();
  pageTitle = 'Dashboard';
  get canApprove(): boolean { return ['MANAGER', 'HR', 'ADMIN'].includes(this.user?.role ?? ''); }
  get canManagePolicies(): boolean { return ['HR', 'ADMIN'].includes(this.user?.role ?? ''); }

  constructor(public authService: AuthService, private router: Router) {
    this.authService.currentUser$.subscribe(user => this.user = user);
    this.updateTitle(this.router.url);
    this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe(event => this.updateTitle((event as NavigationEnd).urlAfterRedirects));
  }

  logout(): void { this.authService.logout(); this.router.navigate(['/login']); }

  private updateTitle(url: string): void {
    const titles: Record<string, string> = { '/dashboard':'Dashboard', '/apply-leave':'Apply Leave', '/my-leaves':'My Leaves', '/approvals':'Approvals', '/assistant':'Leave Assistant', '/admin/ai-policies':'AI Policy Management' };
    this.pageTitle = titles[url.split('?')[0]] ?? 'Dashboard';
  }
}
