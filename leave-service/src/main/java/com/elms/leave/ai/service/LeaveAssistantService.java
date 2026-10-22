package com.elms.leave.ai.service;

import com.elms.leave.ai.dto.ChatRequest;
import com.elms.leave.ai.dto.ChatResponse;
import com.elms.leave.ai.dto.SourceReference;
import com.elms.leave.dto.LeaveBalanceDto;
import com.elms.leave.dto.LeaveResponseDto;
import com.elms.leave.entity.Holiday;
import com.elms.leave.repository.HolidayRepository;
import com.elms.leave.service.LeaveService;
import org.springframework.stereotype.Service;
import org.springframework.security.core.Authentication;

import java.time.LocalDate;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class LeaveAssistantService {

    private static final Pattern DATE_PATTERN = Pattern.compile("\\b\\d{4}-\\d{2}-\\d{2}\\b");
    private static final Pattern REQUEST_ID_PATTERN = Pattern.compile("(?:request|leave)\\s*#?(\\d+)", Pattern.CASE_INSENSITIVE);

    private final AssistantIdentityService identities;
    private final ConversationStore conversations;
    private final IntentRouter intentRouter;
    private final PolicyRagService policyRagService;
    private final LeaveService leaveService;
    private final HolidayRepository holidayRepository;

    public LeaveAssistantService(AssistantIdentityService identities, ConversationStore conversations,
                                 IntentRouter intentRouter, PolicyRagService policyRagService,
                                 LeaveService leaveService, HolidayRepository holidayRepository) {
        this.identities = identities;
        this.conversations = conversations;
        this.intentRouter = intentRouter;
        this.policyRagService = policyRagService;
        this.leaveService = leaveService;
        this.holidayRepository = holidayRepository;
    }

    public ChatResponse chat(ChatRequest request, Authentication authentication) {
        AssistantIdentity identity = identities.resolve(authentication);
        var conversationId = conversations.getOrCreate(request.conversationId(), identity.employeeId());
        conversations.addMessage(conversationId, "USER", request.message());

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
