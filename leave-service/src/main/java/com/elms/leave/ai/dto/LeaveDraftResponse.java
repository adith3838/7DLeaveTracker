package com.elms.leave.ai.dto;

import java.time.LocalDate;
import java.util.UUID;

public record LeaveDraftResponse(
        UUID draftId,
        String status,
        String leaveType,
        LocalDate startDate,
        LocalDate endDate,
        String reason,
        Long leaveRequestId,
        String message) {
}
