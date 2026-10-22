package com.elms.leave.ai.service;

import com.elms.leave.ai.security.AssistantPrincipal;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

@Service
public class AssistantIdentityService {

    private final JdbcTemplate jdbcTemplate;

    public AssistantIdentityService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public AssistantIdentity resolve(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof AssistantPrincipal principal)) {
            throw new AccessDeniedException("A valid ELMS access token is required.");
        }

        Long employeeId = jdbcTemplate.query("SELECT id FROM employee WHERE user_id = ?",
                resultSet -> resultSet.next() ? resultSet.getLong("id") : null,
                principal.userId());
        if (employeeId == null) {
            throw new AccessDeniedException("No employee profile is linked to this account.");
        }
        return new AssistantIdentity(principal.userId(), employeeId, principal.email(), principal.role());
    }
}
