package com.elms.leave.ai.controller;

import com.elms.leave.ai.dto.AiRuntimeStatus;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/ai")
public class AiRuntimeStatusController {

    private final boolean enabled;
    private final ObjectProvider<ChatClient.Builder> chatClients;
    private final ObjectProvider<EmbeddingModel> embeddingModels;
    private final ObjectProvider<VectorStore> vectorStores;

    public AiRuntimeStatusController(
            @Value("${app.ai.enabled:false}") boolean enabled,
            ObjectProvider<ChatClient.Builder> chatClients,
            ObjectProvider<EmbeddingModel> embeddingModels,
            ObjectProvider<VectorStore> vectorStores) {
        this.enabled = enabled;
        this.chatClients = chatClients;
        this.embeddingModels = embeddingModels;
        this.vectorStores = vectorStores;
    }

    @GetMapping("/status")
    public AiRuntimeStatus status() {
        return new AiRuntimeStatus(enabled,
                enabled && chatClients.getIfAvailable() != null,
                enabled && embeddingModels.getIfAvailable() != null,
                enabled && vectorStores.getIfAvailable() != null);
    }
}
