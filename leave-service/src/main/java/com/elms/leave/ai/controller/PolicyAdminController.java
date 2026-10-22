package com.elms.leave.ai.controller;

import com.elms.leave.ai.dto.PolicyDocumentDto;
import com.elms.leave.ai.dto.PolicyDocumentPage;
import com.elms.leave.ai.dto.PolicyKnowledgeHealth;
import com.elms.leave.ai.ingestion.PolicyIngestionService;
import com.elms.leave.ai.security.AssistantPrincipal;
import com.elms.leave.ai.service.PolicyCatalogService;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;

@RestController
@ConditionalOnProperty(prefix = "app.ai", name = "enabled", havingValue = "true")
@RequestMapping("/api/v1/ai/admin/policies")
public class PolicyAdminController {

    private final PolicyIngestionService ingestionService;
    private final PolicyCatalogService catalogService;

    public PolicyAdminController(PolicyIngestionService ingestionService, PolicyCatalogService catalogService) {
        this.ingestionService = ingestionService;
        this.catalogService = catalogService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('HR', 'ADMIN')")
    public PolicyDocumentPage list(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String processingStatus,
            @RequestParam(required = false) String approvalStatus,
            @RequestParam(required = false) String policyType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return catalogService.list(search, processingStatus, approvalStatus, policyType, page, size);
    }

    @GetMapping("/{documentId}")
    @PreAuthorize("hasAnyRole('HR', 'ADMIN')")
    public PolicyDocumentDto get(@PathVariable java.util.UUID documentId) {
        return catalogService.get(documentId);
    }

    @GetMapping("/health")
    @PreAuthorize("hasAnyRole('HR', 'ADMIN')")
    public PolicyKnowledgeHealth health() {
        return catalogService.health();
    }

    @PostMapping(value = "/ingest", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('HR', 'ADMIN')")
    public PolicyIngestionService.IngestionResult ingest(
            @RequestParam("file") MultipartFile file,
            @RequestParam String title,
            @RequestParam String policyType,
            @RequestParam String version,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate effectiveFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate effectiveTo,
            Authentication authentication) throws Exception {
        String uploadedBy = authentication.getPrincipal() instanceof AssistantPrincipal principal
                ? principal.email() : authentication.getName();
        return ingestionService.ingest(file, title, policyType, version, effectiveFrom, effectiveTo, uploadedBy);
    }

    @PatchMapping("/{documentId}/approval")
    @PreAuthorize("hasAnyRole('HR', 'ADMIN')")
    public PolicyDocumentDto approve(@PathVariable java.util.UUID documentId) {
        return catalogService.approve(documentId);
    }

    @PostMapping("/{documentId}/archive")
    @PreAuthorize("hasAnyRole('HR', 'ADMIN')")
    public PolicyDocumentDto archive(@PathVariable java.util.UUID documentId) {
        return catalogService.archive(documentId);
    }
}
