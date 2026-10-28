package com.elms.leave.ai.service;

import com.elms.leave.ai.dto.ChatRequest;
import com.elms.leave.ai.dto.ChatResponse;
import com.elms.leave.ai.dto.SourceReference;
import com.elms.leave.ai.tools.LeaveAssistantTools;
import com.elms.leave.dto.LeaveBalanceDto;
import com.elms.leave.dto.LeaveResponseDto;
import com.elms.leave.entity.Holiday;
import com.elms.leave.repository.HolidayRepository;
import com.elms.leave.service.LeaveService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class LeaveAssistantService {

    private static final Logger log = LoggerFactory.getLogger(LeaveAssistantService.class);
    private static final Pattern DATE_PATTERN = Pattern.compile("\\b\\d{4}-\\d{2}-\\d{2}\\b");
    private static final Pattern REQUEST_ID_PATTERN = Pattern.compile("(?:request|leave)\\s*#?(\\d+)", Pattern.CASE_INSENSITIVE);

    private final AssistantIdentityService identities;
    private final ConversationStore conversations;
    private final IntentRouter intentRouter;
    private final PolicyRagService policyRagService;
    private final LeaveService leaveService;
    private final HolidayRepository holidayRepository;
    private final LeaveAssistantTools tools;
    private final ObjectProvider<ChatClient.Builder> chatClientBuilders;

    public LeaveAssistantService(AssistantIdentityService identities,
                                 ConversationStore conversations,
                                 IntentRouter intentRouter,
                                 PolicyRagService policyRagService,
                                 LeaveService leaveService,
                                 HolidayRepository holidayRepository,
                                 LeaveAssistantTools tools,
                                 ObjectProvider<ChatClient.Builder> chatClientBuilders) {
        this.identities = identities;
        this.conversations = conversations;
        this.intentRouter = intentRouter;
        this.policyRagService = policyRagService;
        this.leaveService = leaveService;
        this.holidayRepository = holidayRepository;
        this.tools = tools;
        this.chatClientBuilders = chatClientBuilders;
    }

    public ChatResponse chat(ChatRequest request, Authentication authentication) {
        AssistantIdentity identity = identities.resolve(authentication);
        var conversationId = conversations.getOrCreate(request.conversationId(), identity.employeeId());
        conversations.addMessage(conversationId, "USER", request.message());

        ChatClient.Builder builder = chatClientBuilders.getIfAvailable();
        if (builder != null) {
            try {
                return executeWithTools(conversationId, request.message(), identity, builder);
            } catch (Exception e) {
                log.warn("AI tool chat failed, falling back to rule-based intent router: {}", e.getMessage(), e);
            }
        }

        return fallbackChat(conversationId, request, identity);
    }

    private ChatResponse executeWithTools(UUID conversationId, String message, AssistantIdentity identity, ChatClient.Builder builder) {
        LeaveAssistantTools.startTurn(identity.employeeId());
        try {
            ChatClient client = builder.build();
            String systemPrompt = """
                You are the ELMS (Employee Leave Management System) AI Assistant.
                Today's date is %s.
                The authenticated employee is %s (ID: %d, Role: %s).

                Available tools:
                - getMyLeaveBalances: retrieve employee's remaining leave balances.
                - getMyLeaveRequests: check employee's submitted leave requests and statuses.
                - getPublicHolidays: check public and company holidays in a date range or year.
                - prepareLeaveDraft: create a leave draft when the employee wishes to apply for, raise, or book leave.
                - confirmLeaveDraft: confirm and officially submit a pending leave draft.
                - searchCompanyPolicies: search official company policies, guidelines, rules, entitlements.

                Instructions:
                - Always execute the appropriate tool(s) to fetch accurate live data before answering.
                - When an employee asks to raise, apply for, take, or book leave (e.g. "can you raise a sick leave for today?", "apply annual leave next week"):
                  1. Call prepareLeaveDraft with the appropriate leave type, start date, and end date (today is %s).
                  2. Present the drafted leave details to the user and explicitly ask them to review and confirm to submit.
                - When the user confirms (e.g. "yes confirm", "submit it", "looks good proceed"):
                  Call confirmLeaveDraft to finalize and submit the leave request.
                - If the question involves multiple topics (e.g. balances AND holidays), call both tools.
                - Be concise, accurate, and professional.
                """.formatted(LocalDate.now(), identity.email(), identity.employeeId(), identity.role(), LocalDate.now());

            String answer = client.prompt()
                    .system(systemPrompt)
                    .user(message)
                    .tools(tools)
                    .toolContext(Map.of("employeeId", identity.employeeId()))
                    .call()
                    .content();

            LeaveAssistantTools.TurnContext turn = LeaveAssistantTools.getTurn();
            List<String> invokedTools = turn != null ? turn.getInvokedTools() : List.of();
            List<SourceReference> sources = turn != null ? turn.getSources() : List.of();
            boolean needsConfirmation = turn != null && turn.isDraftCreated();
            String actionStatus = needsConfirmation ? "AWAITING_CONFIRMATION" : "COMPLETED";
            com.elms.leave.ai.dto.LeaveDraftResponse draft = turn != null ? turn.getDraft() : null;

            String primaryIntent = determineIntent(invokedTools);
            conversations.addMessage(conversationId, "ASSISTANT", answer);
            return new ChatResponse(conversationId, answer, primaryIntent, sources, needsConfirmation, actionStatus, draft);
        } finally {
            LeaveAssistantTools.endTurn();
        }
    }

    private String determineIntent(List<String> invokedTools) {
        if (invokedTools.contains("CONFIRM_LEAVE")) return "APPLY_LEAVE";
        if (invokedTools.contains("APPLY_LEAVE")) return "APPLY_LEAVE";
        if (invokedTools.contains("LEAVE_BALANCE")) return "LEAVE_BALANCE";
        if (invokedTools.contains("LEAVE_STATUS")) return "LEAVE_STATUS";
        if (invokedTools.contains("HOLIDAY_QUERY")) return "HOLIDAY_QUERY";
        if (invokedTools.contains("POLICY_QUESTION")) return "POLICY_QUESTION";
        return "GENERAL";
    }

    private ChatResponse fallbackChat(UUID conversationId, ChatRequest request, AssistantIdentity identity) {
        IntentRouter.Intent intent = intentRouter.classify(request.message());
        String answer;
        List<SourceReference> sources = List.of();
        boolean needsConfirmation = false;
        String actionStatus = "COMPLETED";
        switch (intent) {
            case POLICY_QUESTION -> {
                PolicyRagService.PolicyAnswer policyAnswer = policyRagService.answer(request.message());
                answer = policyAnswer.answer();
                sources = policyAnswer.sources();
                needsConfirmation = policyAnswer.needsClarification();
            }
            case LEAVE_BALANCE -> answer = formatBalance(leaveService.getBalance(identity.employeeId()));
            case LEAVE_STATUS -> answer = formatStatus(identity.employeeId(), request.message());
            case HOLIDAY_QUERY -> answer = formatHolidays(request.message());
            case APPLY_LEAVE -> {
                answer = "I can prepare a leave request, but will not submit it from a chat message. " +
                        "Create a draft with the leave type, start date, end date, and reason, then explicitly confirm it. " +
                        "Use POST /api/v1/ai/leave-drafts followed by POST /api/v1/ai/leave-drafts/{draftId}/confirm.";
                needsConfirmation = true;
                actionStatus = "AWAITING_DETAILS";
            }
            default -> throw new IllegalStateException("Unsupported assistant intent.");
        }
        conversations.addMessage(conversationId, "ASSISTANT", answer);
        return new ChatResponse(conversationId, answer, intent.name(), sources, needsConfirmation, actionStatus);
    }

    private String formatBalance(List<LeaveBalanceDto> balances) {
        if (balances.isEmpty()) return "No leave balance records were found for your employee account. Please contact HR.";
        return "Your current leave balances: " + balances.stream()
                .map(balance -> balance.getLeaveType() + ": " + balance.getRemainingBalance() + " days (" + balance.getYear() + ")")
                .reduce((left, right) -> left + "; " + right)
                .orElse("") + ".";
    }

    private String formatStatus(Long employeeId, String message) {
        List<LeaveResponseDto> requests = leaveService.getLeavesByEmployee(employeeId);
        Matcher matcher = REQUEST_ID_PATTERN.matcher(message);
        if (matcher.find()) {
            Long requestId = Long.parseLong(matcher.group(1));
            return requests.stream().filter(request -> request.getId().equals(requestId)).findFirst()
                    .map(this::formatRequest)
                    .orElse("I could not find that request in your leave history.");
        }
        if (requests.isEmpty()) return "You do not have any leave requests yet.";
        return "Your recent leave requests: " + requests.stream().limit(10).map(this::formatRequest)
                .reduce((left, right) -> left + "; " + right).orElse("");
    }

    private String formatRequest(LeaveResponseDto request) {
        return "Request #" + request.getId() + " (" + request.getLeaveType() + ") is " + request.getStatus() +
                " from " + request.getStartDate() + " to " + request.getEndDate();
    }

    private String formatHolidays(String message) {
        Matcher matcher = DATE_PATTERN.matcher(message);
        LocalDate from = LocalDate.now();
        LocalDate to = from.plusDays(90);
        if (matcher.find()) {
            from = LocalDate.parse(matcher.group());
            if (matcher.find()) to = LocalDate.parse(matcher.group());
            else to = from;
        }
        List<Holiday> holidays = holidayRepository.findByDateBetween(from, to);
        if (holidays.isEmpty()) return "No holidays are listed from " + from + " through " + to + ".";
        return "Holidays from " + from + " through " + to + ": " + holidays.stream()
                .map(holiday -> holiday.getDate() + " — " + holiday.getName() + (Boolean.TRUE.equals(holiday.getIsOptional()) ? " (optional)" : ""))
                .reduce((left, right) -> left + "; " + right).orElse("");
    }
}
