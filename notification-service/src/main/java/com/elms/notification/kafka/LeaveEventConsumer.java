package com.elms.notification.kafka;

import com.elms.notification.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class LeaveEventConsumer {

    private final EmailService emailService;

    @Value("${app.notifications.manager-email}")
    private String managerEmail;

    @Value("${app.notifications.employee-email}")
    private String employeeEmail;

    @KafkaListener(topics = "leave-events", groupId = "notification-group")
    public void handleLeaveEvent(Map<String, Object> event) {
        String eventType = (String) event.get("eventType");
        log.info("Received event: {}", eventType);

        switch (eventType) {
            case "LEAVE_APPLIED" -> handleLeaveApplied(event);
            case "LEAVE_APPROVED" -> handleLeaveApproved(event);
            case "LEAVE_REJECTED" -> handleLeaveRejected(event);
            default -> log.warn("Unknown event type: {}", eventType);
        }
    }

    private void handleLeaveApplied(Map<String, Object> event) {
        Long leaveRequestId = toLong(event.get("leaveRequestId"));
        Long employeeId = toLong(event.get("employeeId"));
        log.info("Leave application #{} from employee #{} — notifying manager", leaveRequestId, employeeId);

        emailService.sendEmail(
                managerEmail,
                "New Leave Request #" + leaveRequestId,
                "Employee #" + employeeId + " has applied for leave. Please review and take action.");
    }

    private void handleLeaveApproved(Map<String, Object> event) {
        Long leaveRequestId = toLong(event.get("leaveRequestId"));
        Long employeeId = toLong(event.get("employeeId"));
        log.info("Leave #{} approved — notifying employee #{}", leaveRequestId, employeeId);

        emailService.sendEmail(
                employeeEmail,
                "Leave Approved #" + leaveRequestId,
                "Your leave request #" + leaveRequestId + " has been approved.");
    }

    private void handleLeaveRejected(Map<String, Object> event) {
        Long leaveRequestId = toLong(event.get("leaveRequestId"));
        Long employeeId = toLong(event.get("employeeId"));
        log.info("Leave #{} rejected — notifying employee #{}", leaveRequestId, employeeId);

        emailService.sendEmail(
                employeeEmail,
                "Leave Rejected #" + leaveRequestId,
                "Your leave request #" + leaveRequestId + " has been rejected.");
    }

    private Long toLong(Object obj) {
        if (obj instanceof Number)
            return ((Number) obj).longValue();
        return Long.parseLong(obj.toString());
    }
}
