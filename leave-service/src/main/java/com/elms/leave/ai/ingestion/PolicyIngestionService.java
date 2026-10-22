package com.elms.leave.ai.ingestion;

import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.jdbc.core.JdbcTemplate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.io.IOException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class PolicyIngestionService {

    private static final Logger log = LoggerFactory.getLogger(PolicyIngestionService.class);

    private final ObjectProvider<VectorStore> vectorStores;
    private final PolicyDocumentLoader loader;
    private final PolicyChunker chunker;
    private final JdbcTemplate jdbcTemplate;

    public PolicyIngestionService(ObjectProvider<VectorStore> vectorStores,
                                  PolicyDocumentLoader loader,
                                  PolicyChunker chunker,
                                  JdbcTemplate jdbcTemplate) {
        this.vectorStores = vectorStores;
        this.loader = loader;
        this.chunker = chunker;
        this.jdbcTemplate = jdbcTemplate;
    }

    public IngestionResult ingest(org.springframework.web.multipart.MultipartFile file,
                                  String title, String policyType, String version,
                                  LocalDate effectiveFrom, LocalDate effectiveTo,
                                  String uploadedBy) throws Exception {
        if (!StringUtils.hasText(title) || title.length() > 250) {
            throw new IllegalArgumentException("Title is required and must be at most 250 characters.");
        }
        if (!StringUtils.hasText(policyType) || policyType.length() > 100) {
            throw new IllegalArgumentException("Policy type is required and must be at most 100 characters.");
        }
        if (!StringUtils.hasText(version) || version.length() > 50) {
            throw new IllegalArgumentException("Version is required and must be at most 50 characters.");
        }
        if (effectiveFrom != null && effectiveTo != null && effectiveTo.isBefore(effectiveFrom)) {
            throw new IllegalArgumentException("Effective-to date cannot precede effective-from date.");
        }

        UUID documentId = UUID.randomUUID();
        String filename = safeFilename(file.getOriginalFilename());
        String contentHash = sha256(file.getBytes());
        Integer duplicate = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM ai.policy_document WHERE policy_type = ? AND version = ? AND content_hash = ?",
                Integer.class, policyType.trim(), version.trim(), contentHash);
        if (duplicate != null && duplicate > 0) {
            throw new IllegalArgumentException("This policy version and content have already been ingested.");
        }
        jdbcTemplate.update("INSERT INTO ai.policy_document " +
                        "(id, title, policy_type, version, status, effective_from, effective_to, source_filename, content_hash, " +
                        "processing_status, processing_stage, uploaded_by, processing_started_at) " +
                        "VALUES (?, ?, ?, ?, 'DRAFT', ?, ?, ?, ?, 'PROCESSING', 'UPLOADING', ?, NOW())",
                documentId, title.trim(), policyType.trim(), version.trim(), effectiveFrom, effectiveTo, filename,
                contentHash, uploadedBy);

        try {
            VectorStore vectorStore = vectorStores.getIfAvailable();
            if (vectorStore == null) {
                throw new IllegalStateException("Policy indexing is unavailable. Configure OpenAI and pgvector.");
            }

            setStage(documentId, "EXTRACTING_TEXT");
            String text = loader.extractText(file);
            setStage(documentId, "CHUNKING");
            List<String> chunks = chunker.split(text);
            if (chunks.isEmpty()) throw new IllegalArgumentException("No indexable text was found in the policy document.");
            jdbcTemplate.update("UPDATE ai.policy_document SET extracted_characters = ? WHERE id = ?", text.length(), documentId);

            List<Document> documents = new ArrayList<>(chunks.size());
            for (int i = 0; i < chunks.size(); i++) {
                Map<String, Object> metadata = new HashMap<>();
                metadata.put("policyDocumentId", documentId.toString());
                metadata.put("title", title.trim());
                metadata.put("policyType", policyType.trim());
                metadata.put("version", version.trim());
                metadata.put("chunkIndex", i);
                metadata.put("effectiveFrom", effectiveFrom == null ? "" : effectiveFrom.toString());
                metadata.put("effectiveTo", effectiveTo == null ? "" : effectiveTo.toString());
                documents.add(new Document(UUID.randomUUID().toString(), chunks.get(i), metadata));
            }
            jdbcTemplate.update("UPDATE ai.policy_document SET chunks_indexed = ? WHERE id = ?", chunks.size(), documentId);

            // Spring AI handles embedding generation and vector persistence within this call;
            // the API cannot truthfully expose those as separate completed stages.
            setStage(documentId, "INDEXING");
            try {
                vectorStore.add(documents);
            } catch (RuntimeException exception) {
                log.error("Policy embedding/vector indexing failed for document {} ({}): {}",
                        documentId, exception.getClass().getSimpleName(), exception.getMessage(), exception);
                throw new IllegalStateException("Embedding or vector indexing failed: " +
                        (exception.getMessage() != null ? exception.getMessage() : "Verify AI model access and database connection."));
            }
            jdbcTemplate.update("UPDATE ai.policy_document SET processing_status = 'READY', processing_stage = 'READY', " +
                            "status = 'PUBLISHED', processing_completed_at = NOW(), failure_reason = NULL, updated_at = NOW() " +
                            "WHERE id = ?",
                    documentId);
            return new IngestionResult(documentId, chunks.size(), "READY", "DRAFT");
        } catch (Exception exception) {
            String safeReason = safeFailureMessage(exception);
                jdbcTemplate.update("UPDATE ai.policy_document SET processing_status = 'FAILED', " +
                    "failure_reason = ?, processing_completed_at = NOW(), updated_at = NOW() WHERE id = ?", safeReason, documentId);
            throw exception;
        }
    }

    private void setStage(UUID documentId, String stage) {
        jdbcTemplate.update("UPDATE ai.policy_document SET processing_stage = ?, updated_at = NOW() WHERE id = ?", stage, documentId);
    }

    private String safeFailureMessage(Exception exception) {
        if (exception instanceof IllegalArgumentException || exception instanceof IllegalStateException || exception instanceof IOException) {
            String message = exception.getMessage();
            return message == null || message.isBlank() ? "The document could not be processed." : message;
        }
        return "Processing failed while extracting or indexing this document. Check service configuration and retry.";
    }

    private String safeFilename(String filename) {
        if (filename == null) return null;
        String normalized = filename.replace('\\', '/');
        return normalized.substring(normalized.lastIndexOf('/') + 1);
    }

    private String sha256(byte[] content) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(content);
            StringBuilder hex = new StringBuilder(digest.length * 2);
            for (byte value : digest) hex.append(String.format("%02x", value));
            return hex.toString();
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is not available.", exception);
        }
    }

    public record IngestionResult(UUID documentId, int chunksIndexed, String processingStatus, String approvalStatus) {
    }
}
