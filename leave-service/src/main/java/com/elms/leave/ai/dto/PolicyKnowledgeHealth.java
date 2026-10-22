package com.elms.leave.ai.dto;

public record PolicyKnowledgeHealth(boolean pgvectorAvailable, boolean embeddingConfigured,
                                    boolean chatConfigured, long approvedEffectiveDocuments,
                                    boolean operational) {
}
