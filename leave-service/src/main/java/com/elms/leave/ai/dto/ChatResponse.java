package com.elms.leave.ai.dto;

import java.util.List;
import java.util.UUID;

public record ChatResponse(
        UUID conversationId,
        String answer,
        String intent,
        List<SourceReference> sources,
        boolean needsConfirmation,
        String actionStatus,
        LeaveDraftResponse draft) {

    public ChatResponse(UUID conversationId, String answer, String intent, List<SourceReference> sources,
                        boolean needsConfirmation, String actionStatus) {
        this(conversationId, answer, intent, sources, needsConfirmation, actionStatus, null);
    }
}
