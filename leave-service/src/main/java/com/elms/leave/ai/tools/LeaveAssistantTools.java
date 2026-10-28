package com.elms.leave.ai.tools;

import com.elms.leave.ai.dto.LeaveDraftRequest;
import com.elms.leave.ai.dto.LeaveDraftResponse;
import com.elms.leave.ai.dto.SourceReference;
import com.elms.leave.ai.service.LeaveDraftService;
import com.elms.leave.ai.service.PolicyRagService;
import com.elms.leave.dto.LeaveBalanceDto;
import com.elms.leave.dto.LeaveResponseDto;
import com.elms.leave.entity.Holiday;
import com.elms.leave.repository.HolidayRepository;
import com.elms.leave.service.LeaveService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.model.ToolContext;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

@Component
public class LeaveAssistantTools {

    private static final Logger log = LoggerFactory.getLogger(LeaveAssistantTools.class);
    private static final ThreadLocal<TurnContext> CURRENT_TURN = new ThreadLocal<>();

    private final LeaveService leaveService;
    private final HolidayRepository holidayRepository;
    private final LeaveDraftService leaveDraftService;
    private final PolicyRagService policyRagService;

    public LeaveAssistantTools(LeaveService leaveService,
                               HolidayRepository holidayRepository,
                               LeaveDraftService leaveDraftService,
                               PolicyRagService policyRagService) {
        this.leaveService = leaveService;
        this.holidayRepository = holidayRepository;
        this.leaveDraftService = leaveDraftService;
        this.policyRagService = policyRagService;
    }

    public static class TurnContext {
        private final Long employeeId;
        private final List<String> invokedTools = new ArrayList<>();
        private final List<SourceReference> sources = new CopyOnWriteArrayList<>();
        private boolean draftCreated = false;
        private LeaveDraftResponse draft;

        public TurnContext(Long employeeId) {
            this.employeeId = employeeId;
        }

        public Long getEmployeeId() {
            return employeeId;
        }

        public synchronized void recordTool(String toolName) {
            invokedTools.add(toolName);
        }

        public List<String> getInvokedTools() {
            return Collections.unmodifiableList(invokedTools);
        }

        public void addSources(List<SourceReference> refs) {
            if (refs != null) {
                sources.addAll(refs);
            }
        }

        public List<SourceReference> getSources() {
            return Collections.unmodifiableList(sources);
        }

        public boolean isDraftCreated() {
            return draftCreated;
        }

        public void setDraftCreated(boolean draftCreated) {
            this.draftCreated = draftCreated;
        }

        public LeaveDraftResponse getDraft() {
            return draft;
        }

        public void setDraft(LeaveDraftResponse draft) {
            this.draft = draft;
        }
    }

    public static void startTurn(Long employeeId) {
        CURRENT_TURN.set(new TurnContext(employeeId));
    }

    public static TurnContext getTurn() {
        return CURRENT_TURN.get();
    }

    public static void endTurn() {
        CURRENT_TURN.remove();
    }

    private Long resolveEmployeeId(ToolContext toolContext) {
        if (toolContext != null && toolContext.getContext() != null) {
            Object id = toolContext.getContext().get("employeeId");
            if (id instanceof Number n) {
                return n.longValue();
            }
            if (id instanceof String s && !s.isBlank()) {
                try {
                    return Long.parseLong(s);
                } catch (NumberFormatException ignored) {}
            }
        }
        TurnContext turn = getTurn();
        return turn != null ? turn.getEmployeeId() : null;
    }

    @Tool(description = "Retrieve the currently authenticated employee's remaining leave balances across all leave types (annual, sick, casual, etc.).")
    public List<LeaveBalanceDto> getMyLeaveBalances(ToolContext toolContext) {
        TurnContext turn = getTurn();
        if (turn != null) turn.recordTool("LEAVE_BALANCE");
        Long employeeId = resolveEmployeeId(toolContext);
        if (employeeId == null) {
            log.warn("getMyLeaveBalances called without resolved employeeId.");
            return List.of();
        }
        log.info("Tool getMyLeaveBalances executed for employeeId={}", employeeId);
        return leaveService.getBalance(employeeId);
    }

    @Tool(description = "Retrieve the current employee's submitted leave requests. Optionally filter by request ID or status (such as PENDING, APPROVED, REJECTED).")
    public List<LeaveResponseDto> getMyLeaveRequests(
            @ToolParam(description = "Optional specific leave request ID to look up", required = false) Long requestId,
            @ToolParam(description = "Optional status filter (e.g. PENDING, APPROVED, REJECTED)", required = false) String status,
            ToolContext toolContext) {
        TurnContext turn = getTurn();
        if (turn != null) turn.recordTool("LEAVE_STATUS");
        Long employeeId = resolveEmployeeId(toolContext);
        if (employeeId == null) {
            log.warn("getMyLeaveRequests called without resolved employeeId.");
            return List.of();
        }
        log.info("Tool getMyLeaveRequests executed for employeeId={}, requestId={}, status={}", employeeId, requestId, status);
        List<LeaveResponseDto> list = leaveService.getLeavesByEmployee(employeeId);
        if (requestId != null) {
            return list.stream().filter(r -> r.getId().equals(requestId)).toList();
        }
        if (status != null && !status.isBlank()) {
            return list.stream().filter(r -> r.getStatus() != null && r.getStatus().equalsIgnoreCase(status.trim())).toList();
        }
        return list;
    }

    @Tool(description = "Lookup official public holidays and company holidays within a date range (ISO YYYY-MM-DD) or for a specific year.")
    public List<Holiday> getPublicHolidays(
            @ToolParam(description = "Optional calendar year (e.g. 2025, 2026)", required = false) Integer year,
            @ToolParam(description = "Start date in ISO format YYYY-MM-DD (defaults to today if omitted)", required = false) String startDate,
            @ToolParam(description = "End date in ISO format YYYY-MM-DD (defaults to 90 days from startDate if omitted)", required = false) String endDate) {
        TurnContext turn = getTurn();
        if (turn != null) turn.recordTool("HOLIDAY_QUERY");
        LocalDate from;
        LocalDate to;
        if (year != null && year > 1900 && year < 2100) {
            from = LocalDate.of(year, 1, 1);
            to = LocalDate.of(year, 12, 31);
        } else {
            try {
                from = (startDate != null && !startDate.isBlank()) ? LocalDate.parse(startDate.trim()) : LocalDate.now();
            } catch (Exception e) {
                from = LocalDate.now();
            }
            try {
                to = (endDate != null && !endDate.isBlank()) ? LocalDate.parse(endDate.trim()) : from.plusDays(90);
            } catch (Exception e) {
                to = from.plusDays(90);
            }
        }
        if (to.isBefore(from)) {
            LocalDate tmp = from;
            from = to;
            to = tmp;
        }
        log.info("Tool getPublicHolidays executed for from={} to={}", from, to);
        return holidayRepository.findByDateBetween(from, to);
    }

    public static String normalizeLeaveType(String type) {
        if (type == null || type.isBlank()) return "ANNUAL LEAVE";
        String upper = type.trim().toUpperCase().replace("-", " ").replace("_", " ");
        if (upper.equals("ANNUAL") || upper.equals("ANNUAL LEAVE") || upper.equals("PLANNED") || upper.equals("VACATION")) {
            return "ANNUAL LEAVE";
        }
        if (upper.contains("SICK")) return "SICK";
        if (upper.contains("MATERNITY")) return "MATERNITY";
        if (upper.contains("PATERNITY")) return "PATERNITY";
        if (upper.contains("BEREAVEMENT")) return "BEREAVEMENT";
        if (upper.contains("COMP") || upper.contains("COMPENSATORY")) return "COMP_OFF";
        if (upper.contains("STUDY")) return "STUDY";
        if (upper.contains("UMRAH")) return "UMRAH";
        return upper;
    }

    @Tool(description = "Prepare a leave application draft for the authenticated employee. Creates a draft requiring user confirmation before submission. Use this when the employee asks to raise, apply for, take, or book leave.")
    public String prepareLeaveDraft(
            @ToolParam(description = "Leave type: SICK, ANNUAL LEAVE, CASUAL, COMP_OFF, MATERNITY, PATERNITY, BEREAVEMENT, STUDY, UMRAH") String leaveType,
            @ToolParam(description = "Start date in ISO format YYYY-MM-DD") String startDate,
            @ToolParam(description = "End date in ISO format YYYY-MM-DD") String endDate,
            @ToolParam(description = "Reason or notes for taking leave", required = false) String reason,
            ToolContext toolContext) {
        TurnContext turn = getTurn();
        if (turn != null) {
            turn.recordTool("APPLY_LEAVE");
            turn.setDraftCreated(true);
        }
        Long employeeId = resolveEmployeeId(toolContext);
        if (employeeId == null) {
            return "Unable to prepare leave draft: employee ID could not be identified.";
        }
        try {
            LocalDate start = LocalDate.parse(startDate.trim());
            LocalDate end = LocalDate.parse(endDate.trim());
            String normalizedType = normalizeLeaveType(leaveType);
            String effectiveReason = (reason != null && !reason.isBlank()) ? reason.trim() : (normalizedType + " request submitted via AI Assistant");
            LeaveDraftRequest req = new LeaveDraftRequest(normalizedType, start, end, effectiveReason);
            LeaveDraftResponse response = leaveDraftService.create(employeeId, req);
            if (turn != null) {
                turn.setDraft(response);
            }
            log.info("Tool prepareLeaveDraft created draftId={} for employeeId={}", response.draftId(), employeeId);
            return String.format("Draft created successfully with Draft ID: %s. Type: %s, Dates: %s to %s. Reason: %s. " +
                            "Please ask the employee to review these details and confirm to submit the leave request.",
                    response.draftId(), response.leaveType(), response.startDate(), response.endDate(), response.reason());
        } catch (Exception e) {
            log.warn("Tool prepareLeaveDraft failed: {}", e.getMessage());
            return "Could not prepare leave draft: " + e.getMessage() + ". Please verify dates and leave type.";
        }
    }

    @Tool(description = "Confirm and officially submit a pending leave draft. Use this when the employee says yes, confirms, or asks to submit the previously prepared leave draft.")
    public String confirmLeaveDraft(
            @ToolParam(description = "Optional specific draft UUID to confirm. If omitted, the latest pending draft is confirmed.", required = false) String draftId,
            ToolContext toolContext) {
        TurnContext turn = getTurn();
        if (turn != null) turn.recordTool("CONFIRM_LEAVE");
        Long employeeId = resolveEmployeeId(toolContext);
        if (employeeId == null) {
            return "Unable to confirm leave draft: employee ID could not be identified.";
        }
        try {
            LeaveDraftResponse response;
            if (draftId != null && !draftId.isBlank()) {
                response = leaveDraftService.confirm(employeeId, java.util.UUID.fromString(draftId.trim()));
            } else {
                response = leaveDraftService.confirmLatest(employeeId);
            }
            if (turn != null) {
                turn.setDraft(response);
            }
            return String.format("Leave request #%d for %s (%s to %s) has been officially submitted and is now pending manager approval.",
                    response.leaveRequestId(), response.leaveType(), response.startDate(), response.endDate());
        } catch (Exception e) {
            log.warn("Tool confirmLeaveDraft failed: {}", e.getMessage());
            return "Failed to submit leave draft: " + e.getMessage();
        }
    }

    @Tool(description = "Search published company leave policies, rules, entitlements, carry-over guidelines, probation rules, and regulations.")
    public String searchCompanyPolicies(
            @ToolParam(description = "Question or topic regarding company leave policies") String query) {
        TurnContext turn = getTurn();
        if (turn != null) turn.recordTool("POLICY_QUESTION");
        log.info("Tool searchCompanyPolicies executed for query='{}'", query);
        try {
            PolicyRagService.PolicyAnswer answer = policyRagService.answer(query);
            if (turn != null && answer.sources() != null) {
                turn.addSources(answer.sources());
            }
            return answer.answer();
        } catch (Exception e) {
            log.error("Tool searchCompanyPolicies failed: {}", e.getMessage(), e);
            return "Policy search is temporarily unavailable: " + e.getMessage();
        }
    }
}

