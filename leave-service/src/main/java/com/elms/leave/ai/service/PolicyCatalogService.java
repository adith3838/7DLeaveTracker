package com.elms.leave.ai.service;

import com.elms.leave.ai.dto.PolicyDocumentDto;
import com.elms.leave.ai.dto.PolicyDocumentPage;
import com.elms.leave.ai.dto.PolicyDocumentCounts;
import com.elms.leave.ai.dto.PolicyKnowledgeHealth;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class PolicyCatalogService {

    private static final int MAX_PAGE_SIZE = 100;
    private static final List<String> PIPELINE = List.of(
            "UPLOADING", "EXTRACTING_TEXT", "CHUNKING", "INDEXING", "READY");
    private final JdbcTemplate jdbcTemplate;
    private final ObjectProvider<VectorStore> vectorStores;
    private final ObjectProvider<ChatClient.Builder> chatClientBuilders;

    public PolicyCatalogService(JdbcTemplate jdbcTemplate, ObjectProvider<VectorStore> vectorStores,
                                ObjectProvider<ChatClient.Builder> chatClientBuilders) {
        this.jdbcTemplate = jdbcTemplate;
        this.vectorStores = vectorStores;
        this.chatClientBuilders = chatClientBuilders;
    }

    public PolicyKnowledgeHealth health() {
        Boolean pgvector = jdbcTemplate.queryForObject(
                "SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector')", Boolean.class);
        Long approved = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM ai.policy_document " +
                "WHERE processing_status = 'READY' AND approval_status = 'APPROVED' " +
                "AND status = 'PUBLISHED' AND (effective_from IS NULL OR effective_from <= CURRENT_DATE) " +
                "AND (effective_to IS NULL OR effective_to >= CURRENT_DATE)", Long.class);
        boolean embeddingsConfigured = vectorStores.getIfAvailable() != null;
        boolean chatConfigured = chatClientBuilders.getIfAvailable() != null;
        boolean vectorAvailable = Boolean.TRUE.equals(pgvector);
        return new PolicyKnowledgeHealth(vectorAvailable, embeddingsConfigured, chatConfigured,
                approved == null ? 0 : approved,
                vectorAvailable && embeddingsConfigured && chatConfigured && approved != null && approved > 0);
    }

    public PolicyDocumentPage list(String search, String processingStatus, String approvalStatus,
                                   String policyType, int page, int size) {
        if (page < 0) throw new IllegalArgumentException("Page must be zero or greater.");
        int boundedSize = Math.max(1, Math.min(size, MAX_PAGE_SIZE));
        String normalizedSearch = StringUtils.hasText(search) ? "%" + search.trim() + "%" : null;
        String normalizedProcessing = normalizeFilter(processingStatus,
                List.of("QUEUED", "PROCESSING", "READY", "FAILED", "CANCELLED"));
        String normalizedApproval = normalizeFilter(approvalStatus,
                List.of("DRAFT", "PENDING_APPROVAL", "APPROVED", "ARCHIVED"));
        String normalizedType = StringUtils.hasText(policyType) ? policyType.trim() : null;
        String where = " WHERE (CAST(? AS TEXT) IS NULL OR title ILIKE CAST(? AS TEXT) OR source_filename ILIKE CAST(? AS TEXT))" +
            " AND (CAST(? AS TEXT) IS NULL OR processing_status = CAST(? AS TEXT))" +
            " AND (CAST(? AS TEXT) IS NULL OR approval_status = CAST(? AS TEXT))" +
            " AND (CAST(? AS TEXT) IS NULL OR policy_type = CAST(? AS TEXT))";
        Object[] params = {normalizedSearch, normalizedSearch, normalizedSearch,
                normalizedProcessing, normalizedProcessing, normalizedApproval, normalizedApproval,
                normalizedType, normalizedType};
        Long total = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM ai.policy_document" + where, Long.class, params);
        String sql = "SELECT id, source_filename, title, policy_type, version, effective_from, effective_to, " +
                "processing_status, processing_stage, approval_status, uploaded_by, created_at, updated_at, " +
                "processing_started_at, processing_completed_at, failure_reason, extracted_characters, chunks_indexed " +
                "FROM ai.policy_document" + where + " ORDER BY created_at DESC LIMIT ? OFFSET ?";
        List<Object> listParams = new ArrayList<>(java.util.Arrays.asList(params));
        listParams.add(boundedSize);
        listParams.add(page * boundedSize);
        List<PolicyDocumentDto> documents = jdbcTemplate.query(sql, listParams.toArray(), rowMapper());
        PolicyDocumentCounts counts = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) AS total, " +
                        "COUNT(*) FILTER (WHERE processing_status = 'READY' AND approval_status = 'APPROVED' " +
                        "AND status = 'PUBLISHED' AND (effective_from IS NULL OR effective_from <= CURRENT_DATE) " +
                        "AND (effective_to IS NULL OR effective_to >= CURRENT_DATE)) AS ready, " +
                "COUNT(*) FILTER (WHERE processing_status IN ('QUEUED', 'PROCESSING')) AS processing, " +
                "COUNT(*) FILTER (WHERE processing_status = 'FAILED') AS failed " +
                "FROM ai.policy_document",
            (rs, rowNum) -> new PolicyDocumentCounts(rs.getLong("total"), rs.getLong("ready"),
                rs.getLong("processing"), rs.getLong("failed")));
        return new PolicyDocumentPage(documents, total == null ? 0 : total, page, boundedSize, counts);
    }

    public PolicyDocumentDto get(UUID id) {
        return jdbcTemplate.query("SELECT id, source_filename, title, policy_type, version, effective_from, effective_to, " +
                        "processing_status, processing_stage, approval_status, uploaded_by, created_at, updated_at, " +
                        "processing_started_at, processing_completed_at, failure_reason, extracted_characters, chunks_indexed " +
                        "FROM ai.policy_document WHERE id = ?", rowMapper(), id)
                .stream().findFirst().orElseThrow(() -> new IllegalArgumentException("Policy document was not found."));
    }

    @Transactional
    public PolicyDocumentDto approve(UUID id) {
        int changed = jdbcTemplate.update("UPDATE ai.policy_document SET approval_status = 'APPROVED', " +
                        "updated_at = NOW() WHERE id = ? AND processing_status = 'READY' " +
                        "AND approval_status IN ('DRAFT', 'PENDING_APPROVAL') AND status = 'PUBLISHED' " +
                        "AND (effective_to IS NULL OR effective_to >= CURRENT_DATE)", id);
        if (changed == 0) {
            throw new IllegalStateException("Only successfully indexed, non-expired draft policies can be approved.");
        }
        return get(id);
    }

    @Transactional
    public PolicyDocumentDto archive(UUID id) {
        int changed = jdbcTemplate.update("UPDATE ai.policy_document SET approval_status = 'ARCHIVED', status = 'ARCHIVED', " +
                "updated_at = NOW() WHERE id = ? AND approval_status <> 'ARCHIVED'", id);
        if (changed == 0) throw new IllegalArgumentException("Policy document was not found or is already archived.");
        return get(id);
    }

    private String normalizeFilter(String value, List<String> allowed) {
        if (!StringUtils.hasText(value)) return null;
        String normalized = value.trim().toUpperCase();
        if (!allowed.contains(normalized)) throw new IllegalArgumentException("Unsupported policy status filter.");
        return normalized;
    }

    private RowMapper<PolicyDocumentDto> rowMapper() {
        return this::map;
    }

    private PolicyDocumentDto map(ResultSet rs, int rowNum) throws SQLException {
        String processingStatus = rs.getString("processing_status");
        String stage = rs.getString("processing_stage");
        List<PolicyDocumentDto.PipelineStage> pipeline = pipeline(processingStatus, stage);
        return new PolicyDocumentDto(
                rs.getObject("id", UUID.class), rs.getString("source_filename"), rs.getString("title"),
                rs.getString("policy_type"), rs.getString("version"),
                rs.getObject("effective_from", java.time.LocalDate.class),
                rs.getObject("effective_to", java.time.LocalDate.class), processingStatus, stage,
                rs.getString("approval_status"), rs.getString("uploaded_by"),
                rs.getTimestamp("created_at").toInstant(), rs.getTimestamp("updated_at").toInstant(),
                instant(rs, "processing_started_at"), instant(rs, "processing_completed_at"),
                rs.getString("failure_reason"), (Integer) rs.getObject("extracted_characters"),
                (Integer) rs.getObject("chunks_indexed"), pipeline);
    }

    private java.time.Instant instant(ResultSet rs, String column) throws SQLException {
        java.sql.Timestamp timestamp = rs.getTimestamp(column);
        return timestamp == null ? null : timestamp.toInstant();
    }

    private List<PolicyDocumentDto.PipelineStage> pipeline(String status, String currentStage) {
        List<PolicyDocumentDto.PipelineStage> stages = new ArrayList<>();
        for (String name : PIPELINE) {
            String stageStatus;
            if ("FAILED".equals(status)) {
                int failedIndex = PIPELINE.indexOf(currentStage);
                int stageIndex = PIPELINE.indexOf(name);
                stageStatus = failedIndex < 0 ? "PENDING" : stageIndex < failedIndex ? "COMPLETED" : stageIndex == failedIndex ? "FAILED" : "PENDING";
            } else if ("READY".equals(status)) {
                stageStatus = "COMPLETED";
            } else {
                int currentIndex = PIPELINE.indexOf(currentStage);
                int stageIndex = PIPELINE.indexOf(name);
                stageStatus = stageIndex < currentIndex ? "COMPLETED" : stageIndex == currentIndex ? "IN_PROGRESS" : "PENDING";
            }
            stages.add(new PolicyDocumentDto.PipelineStage(name, stageStatus));
        }
        return stages;
    }
}
