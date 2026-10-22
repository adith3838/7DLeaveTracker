import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
    { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
    {
        path: 'login',
        loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
    },
    {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
        canActivate: [authGuard]
    },
    {
        path: 'apply-leave',
        loadComponent: () => import('./pages/apply-leave/apply-leave.component').then(m => m.ApplyLeaveComponent),
        canActivate: [authGuard]
    },
    {
        path: 'my-leaves',
        loadComponent: () => import('./pages/my-leaves/my-leaves.component').then(m => m.MyLeavesComponent),
        canActivate: [authGuard]
    },
    {
        path: 'approvals',
        loadComponent: () => import('./pages/approvals/approvals.component').then(m => m.ApprovalsComponent),
        canActivate: [authGuard]
    },
    {
        path: 'assistant',
        loadComponent: () => import('./pages/assistant/assistant.component').then(m => m.AssistantComponent),
        canActivate: [authGuard]
    },
    {
        path: 'admin/ai-policies',
        loadComponent: () => import('./pages/policy-management/policy-management.page').then(m => m.PolicyManagementPage),
        canActivate: [authGuard]
    },
    { path: '**', redirectTo: '/dashboard' }
];
