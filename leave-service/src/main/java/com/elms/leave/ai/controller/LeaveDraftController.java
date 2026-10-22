package com.elms.leave.ai.controller;

import com.elms.leave.ai.dto.LeaveDraftRequest;
import com.elms.leave.ai.dto.LeaveDraftResponse;
import com.elms.leave.ai.service.AssistantIdentityService;
import com.elms.leave.ai.service.LeaveDraftService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.core.Authentication;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;

import java.util.UUID;

@RestController
@ConditionalOnProperty(prefix = "app.ai", name = "enabled", havingValue = "true")
@RequestMapping("/api/v1/ai/leave-drafts")
public class LeaveDraftController {

    private final AssistantIdentityService identities;
    private final LeaveDraftService drafts;

    public LeaveDraftController(AssistantIdentityService identities, LeaveDraftService drafts) {
        this.identities = identities;
        this.drafts = drafts;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public LeaveDraftResponse create(@Valid @RequestBody LeaveDraftRequest request, Authentication authentication) {
        return drafts.create(identities.resolve(authentication).employeeId(), request);
    }

    @PostMapping("/{draftId}/confirm")
    public LeaveDraftResponse confirm(@PathVariable UUID draftId, Authentication authentication) {
        return drafts.confirm(identities.resolve(authentication).employeeId(), draftId);
    }
}
