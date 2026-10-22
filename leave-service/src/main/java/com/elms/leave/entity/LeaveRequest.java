package com.elms.leave.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "leave_request")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeaveRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "employee_id", nullable = false)
    private Long employeeId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "leave_type_id", nullable = false)
    private LeaveType leaveType;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private LeaveStatus status = LeaveStatus.PENDING;

    @Column(length = 500)
    private String reason;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "approved_by")
    private Long approvedBy;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public enum LeaveStatus {
        PENDING, APPROVED, REJECTED, CANCELLED
    }
}
