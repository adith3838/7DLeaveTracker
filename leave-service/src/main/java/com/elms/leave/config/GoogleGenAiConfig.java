package com.elms.leave.config;

import com.google.genai.Client;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.google.genai.GoogleGenAiEmbeddingConnectionDetails;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.util.StringUtils;

@Configuration(proxyBeanMethods = false)
@ConditionalOnClass({Client.class, GoogleGenAiEmbeddingConnectionDetails.class})
public class GoogleGenAiConfig {

    private static final Logger log = LoggerFactory.getLogger(GoogleGenAiConfig.class);
    private final Environment env;

    public GoogleGenAiConfig(Environment env) {
        this.env = env;
    }

    private String resolveApiKey(String rawApiKey) {
        if (StringUtils.hasText(rawApiKey) && !rawApiKey.startsWith("${")) {
            return rawApiKey.trim();
        }
        String key = env != null ? env.getProperty("GOOGLE_API_KEY") : null;
        if (!StringUtils.hasText(key) && env != null) {
            key = env.getProperty("spring.ai.google.genai.chat.api-key");
        }
        if (!StringUtils.hasText(key) && env != null) {
            key = env.getProperty("spring.ai.google.genai.api-key");
        }
        if (!StringUtils.hasText(key)) {
            key = System.getenv("GOOGLE_API_KEY");
        }
        return StringUtils.hasText(key) ? key.trim() : null;
    }

    @Bean
    @ConditionalOnMissingBean
    public GoogleGenAiEmbeddingConnectionDetails googleGenAiEmbeddingConnectionDetails(
            @Value("${spring.ai.google.genai.embedding.api-key:${spring.ai.google.genai.api-key:}}") String rawApiKey) {
        String apiKey = resolveApiKey(rawApiKey);
        if (StringUtils.hasText(apiKey)) {
            log.info("Configuring Google GenAI embedding connection with provided API key.");
            return GoogleGenAiEmbeddingConnectionDetails.builder().apiKey(apiKey).build();
        }
        log.warn("GOOGLE_API_KEY is not set. Google GenAI embeddings will use placeholder connection details.");
        return GoogleGenAiEmbeddingConnectionDetails.builder().apiKey("placeholder-unconfigured-api-key").build();
    }

    @Bean
    @ConditionalOnMissingBean
    public org.springframework.ai.google.genai.text.GoogleGenAiTextEmbeddingModel googleGenAiTextEmbeddingModel(
            GoogleGenAiEmbeddingConnectionDetails connectionDetails,
            @Value("${spring.ai.google.genai.embedding.text.options.model:${GEMINI_EMBEDDING_MODEL:gemini-embedding-001}}") String modelName,
            @Value("${spring.ai.google.genai.embedding.text.options.dimensions:768}") int dimensions) {
        org.springframework.ai.google.genai.text.GoogleGenAiTextEmbeddingOptions options = 
                org.springframework.ai.google.genai.text.GoogleGenAiTextEmbeddingOptions.builder()
                        .model(modelName)
                        .dimensions(dimensions)
                        .build();
        log.info("Configuring GoogleGenAiTextEmbeddingModel with model='{}' and dimensions={}", modelName, dimensions);
        return new org.springframework.ai.google.genai.text.GoogleGenAiTextEmbeddingModel(connectionDetails, options);
    }

    @Bean
    @ConditionalOnMissingBean
    public Client googleGenAiClient(
            @Value("${spring.ai.google.genai.chat.api-key:${spring.ai.google.genai.api-key:}}") String rawApiKey) {
        String apiKey = resolveApiKey(rawApiKey);
        if (StringUtils.hasText(apiKey)) {
            log.info("Configuring Google GenAI client with resolved API key (length={}).", apiKey.length());
            return Client.builder().apiKey(apiKey).build();
        }
        log.warn("GOOGLE_API_KEY is not set. Google GenAI chat client will use placeholder client.");
        return Client.builder().apiKey("placeholder-unconfigured-api-key").build();
    }

    @Bean
    @ConditionalOnMissingBean
    public org.springframework.ai.google.genai.GoogleGenAiChatModel googleGenAiChatModel(
            Client client,
            org.springframework.beans.factory.ObjectProvider<org.springframework.ai.model.tool.ToolCallingManager> toolCallingManagerProvider,
            @Value("${spring.ai.google.genai.chat.options.model:${GEMINI_CHAT_MODEL:gemini-3.8-flash}}") String modelName,
            @Value("${spring.ai.google.genai.chat.options.temperature:0.1}") double temperature) {
        log.info("Configuring GoogleGenAiChatModel with model='{}' and temperature={}", modelName, temperature);
        org.springframework.ai.google.genai.GoogleGenAiChatOptions options = 
                org.springframework.ai.google.genai.GoogleGenAiChatOptions.builder()
                        .model(modelName)
                        .temperature(temperature)
                        .build();
        var builder = org.springframework.ai.google.genai.GoogleGenAiChatModel.builder()
                .genAiClient(client)
                .defaultOptions(options);
        toolCallingManagerProvider.ifAvailable(builder::toolCallingManager);
        return builder.build();
    }

    @Bean
    @ConditionalOnMissingBean
    public org.springframework.ai.chat.client.ChatClient.Builder chatClientBuilder(
            org.springframework.ai.chat.model.ChatModel chatModel) {
        return org.springframework.ai.chat.client.ChatClient.builder(chatModel);
    }
}

