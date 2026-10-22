package com.elms.leave.ai.controller;

import com.elms.leave.ai.dto.ChatRequest;
import com.elms.leave.ai.dto.ChatResponse;
import com.elms.leave.ai.service.LeaveAssistantService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.core.Authentication;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;

@RestController
@ConditionalOnProperty(prefix = "app.ai", name = "enabled", havingValue = "true")
@RequestMapping("/api/v1/ai")
public class ChatController {

    private final LeaveAssistantService assistantService;

    public ChatController(LeaveAssistantService assistantService) {
        this.assistantService = assistantService;
    }

    @PostMapping("/chat")
    public ChatResponse chat(@Valid @RequestBody ChatRequest request, Authentication authentication) {
        return assistantService.chat(request, authentication);
    }
}
