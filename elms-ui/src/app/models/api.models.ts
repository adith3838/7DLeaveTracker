export interface LoginRequest {
    email: string;
    password: string;
}

export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    user: User;
}

export interface User {
    id: number;
    name: string;
    email: string;
    role: 'EMPLOYEE' | 'MANAGER' | 'HR' | 'ADMIN';
}

export interface LeaveRequest {
    startDate: string;
    endDate: string;
    leaveType: 'PLANNED' | 'SICK' | 'CASUAL' | 'UNPAID';
    reason?: string;
}

export interface LeaveResponse {
    id: number;
    employeeId: number;
    leaveType: string;
    startDate: string;
    endDate: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
    reason: string;
    createdAt: string;
    approvedBy?: number;
}

export interface LeaveBalance {
    leaveType: string;
    remainingBalance: number;
    year: number;
}

export interface Holiday {
    id: number;
    date: string;
    name: string;
    isOptional: boolean;
}

export interface Employee {
    id: number;
    userId: number;
    fullName: string;
    email: string;
    department: string;
    managerId?: number;
    managerName?: string;
    joinDate: string;
    role: string;
}
