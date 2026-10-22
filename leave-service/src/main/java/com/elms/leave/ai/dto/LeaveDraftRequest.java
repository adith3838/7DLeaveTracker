package com.elms.leave.ai.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record LeaveDraftRequest(
        @NotBlank @Size(max = 30) String leaveType,
        @NotNull LocalDate startDate,
        @NotNull LocalDate endDate,
        @Size(max = 1000) String reason) {
}
