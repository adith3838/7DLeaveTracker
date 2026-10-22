package com.elms.leave.ai.dto;

public record AiRuntimeStatus(
        boolean enabled,
        boolean chatModelConfigured,
        boolean embeddingModelConfigured,
        boolean vectorStoreConfigured) {
}
