package com.elms.leave.ai.service;

import com.elms.leave.ai.dto.LeaveDraftRequest;
import com.elms.leave.ai.dto.LeaveDraftResponse;
import com.elms.leave.dto.LeaveRequestDto;
import com.elms.leave.dto.LeaveResponseDto;
import com.elms.leave.service.LeaveService;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.UUID;

@Service
public class LeaveDraftService {

	private final JdbcTemplate jdbcTemplate;
	private final LeaveService leaveService;

	public LeaveDraftService(JdbcTemplate jdbcTemplate, LeaveService leaveService) {
		this.jdbcTemplate = jdbcTemplate;
		this.leaveService = leaveService;
	}

	@Transactional
	public LeaveDraftResponse create(Long employeeId, LeaveDraftRequest request) {
		if (request.startDate().isAfter(request.endDate())) {
			throw new IllegalArgumentException("Start date must be on or before end date.");
		}
		if (request.startDate().isBefore(LocalDate.now())) {
			throw new IllegalArgumentException("Leave drafts cannot start in the past.");
		}
		UUID id = UUID.randomUUID();
		jdbcTemplate.update("INSERT INTO ai.leave_draft " +
						"(id, employee_id, leave_type, start_date, end_date, reason, expires_at) " +
						"VALUES (?, ?, ?, ?, ?, ?, NOW() + INTERVAL '20 minutes')",
				id, employeeId, request.leaveType().trim().toUpperCase(), request.startDate(),
				request.endDate(), request.reason());
		return new LeaveDraftResponse(id, "AWAITING_CONFIRMATION", request.leaveType().trim().toUpperCase(),
				request.startDate(), request.endDate(), request.reason(), null,
				"Review the request details, then explicitly confirm it to submit.");
	}

	@Transactional
	public LeaveDraftResponse confirm(Long employeeId, UUID draftId) {
		Draft draft = jdbcTemplate.query("SELECT id, employee_id, leave_type, start_date, end_date, reason, " +
						"status, expires_at > NOW() AS is_valid FROM ai.leave_draft WHERE id = ? FOR UPDATE",
				resultSet -> resultSet.next() ? mapDraft(resultSet) : null, draftId);
		if (draft == null || !draft.employeeId().equals(employeeId)) {
			throw new AccessDeniedException("Leave draft not found for this employee.");
		}
		if (!"DRAFT".equals(draft.status())) {
			throw new IllegalStateException("This leave draft has already been submitted or is no longer active.");
		}
		if (!draft.notExpired()) {
			jdbcTemplate.update("UPDATE ai.leave_draft SET status = 'EXPIRED' WHERE id = ?", draftId);
			return response(draft, "EXPIRED", null, "This draft expired. Create a new draft to continue.");
		}

		LeaveRequestDto request = new LeaveRequestDto();
		request.setLeaveType(draft.leaveType());
		request.setStartDate(draft.startDate());
		request.setEndDate(draft.endDate());
		request.setReason(draft.reason());
		LeaveResponseDto submitted = leaveService.applyLeave(employeeId, null, request);
		jdbcTemplate.update("UPDATE ai.leave_draft SET status = 'SUBMITTED', leave_request_id = ? WHERE id = ?",
				submitted.getId(), draftId);
		return response(draft, "SUBMITTED", submitted.getId(),
				"Leave request submitted successfully. Request #" + submitted.getId() + " is pending approval.");
	}

	private Draft mapDraft(ResultSet resultSet) throws SQLException {
		return new Draft(resultSet.getObject("id", UUID.class), resultSet.getLong("employee_id"), resultSet.getString("leave_type"),
				resultSet.getObject("start_date", LocalDate.class), resultSet.getObject("end_date", LocalDate.class),
				resultSet.getString("reason"), resultSet.getString("status"), resultSet.getBoolean("is_valid"));
	}

	private LeaveDraftResponse response(Draft draft, String status, Long requestId, String message) {
		return new LeaveDraftResponse(draft.id(), status, draft.leaveType(), draft.startDate(), draft.endDate(),
				draft.reason(), requestId, message);
	}

	private record Draft(UUID id, Long employeeId, String leaveType, LocalDate startDate, LocalDate endDate,
						 String reason, String status, boolean notExpired) {
	}
}
