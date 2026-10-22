package com.elms.leave.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaveBalanceDto {
    private String leaveType;
    private Integer remainingBalance;
    private Integer year;
}
