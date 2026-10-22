package com.elms.leave.ai.dto;

import java.util.List;
import java.util.UUID;

public record ChatResponse(
        UUID conversationId,
        String answer,
        String intent,
        List<SourceReference> sources,
        boolean needsConfirmation,
        String actionStatus) {
}
