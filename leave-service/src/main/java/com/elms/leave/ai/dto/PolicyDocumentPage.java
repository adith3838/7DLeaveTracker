package com.elms.leave.ai.dto;

import java.util.List;

public record PolicyDocumentPage(List<PolicyDocumentDto> documents, long total, int page, int size,
								 PolicyDocumentCounts counts) {
}
