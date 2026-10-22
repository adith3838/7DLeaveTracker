package com.elms.leave.ai.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record PolicyDocumentDto(
        UUID id,
        String filename,
        String title,
        String policyType,
        String version,
        LocalDate effectiveFrom,
        LocalDate effectiveTo,
        String processingStatus,
        String processingStage,
        String approvalStatus,
        String uploadedBy,
        Instant uploadedAt,
        Instant updatedAt,
        Instant processingStartedAt,
        Instant processingCompletedAt,
        String failureReason,
        Integer extractedCharacters,
        Integer chunksIndexed,
        List<PipelineStage> pipeline) {

    public record PipelineStage(String name, String status) {
    }
}
