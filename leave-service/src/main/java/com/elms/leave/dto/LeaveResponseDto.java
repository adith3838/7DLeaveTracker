package com.elms.leave.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaveResponseDto {
    private Long id;
    private Long employeeId;
    private String leaveType;
    private LocalDate startDate;
    private LocalDate endDate;
    private String status;
    private String reason;
    private LocalDateTime createdAt;
    private Long approvedBy;
}
