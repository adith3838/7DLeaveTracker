package com.elms.leave.ai.service;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class ConversationStore {

    private final JdbcTemplate jdbcTemplate;

    public ConversationStore(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional
    public UUID getOrCreate(UUID requestedId, Long employeeId) {
        if (requestedId == null) {
            UUID id = UUID.randomUUID();
            jdbcTemplate.update("INSERT INTO ai.chat_conversation (id, employee_id) VALUES (?, ?)", id, employeeId);
            return id;
        }

            int owned = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM ai.chat_conversation WHERE id = ? AND employee_id = ?",
                    int.class, requestedId, employeeId);
            if (owned != 1) {
            throw new AccessDeniedException("Conversation not found for this employee.");
        }
        jdbcTemplate.update("UPDATE ai.chat_conversation SET updated_at = NOW() WHERE id = ?", requestedId);
        return requestedId;
    }

    @Transactional
    public void addMessage(UUID conversationId, String role, String content) {
        jdbcTemplate.update("INSERT INTO ai.chat_message (id, conversation_id, role, content) VALUES (?, ?, ?, ?)",
                UUID.randomUUID(), conversationId, role, content);
    }
}
