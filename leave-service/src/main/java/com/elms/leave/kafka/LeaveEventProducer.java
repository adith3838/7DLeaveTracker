package com.elms.leave.kafka;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class LeaveEventProducer {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    private static final String TOPIC = "leave-events";

    public void sendLeaveApplied(Long leaveRequestId, Long employeeId, Long managerId) {
        Map<String, Object> event = Map.of(
                "eventType", "LEAVE_APPLIED",
                "leaveRequestId", leaveRequestId,
                "employeeId", employeeId,
                "managerId", managerId != null ? managerId : 0);
        kafkaTemplate.send(TOPIC, event);
        log.info("Published LEAVE_APPLIED event for request {}", leaveRequestId);
    }

    public void sendLeaveApproved(Long leaveRequestId, Long employeeId, Long approvedBy) {
        Map<String, Object> event = Map.of(
                "eventType", "LEAVE_APPROVED",
                "leaveRequestId", leaveRequestId,
                "employeeId", employeeId,
                "approvedBy", approvedBy);
        kafkaTemplate.send(TOPIC, event);
        log.info("Published LEAVE_APPROVED event for request {}", leaveRequestId);
    }

    public void sendLeaveRejected(Long leaveRequestId, Long employeeId, Long rejectedBy) {
        Map<String, Object> event = Map.of(
                "eventType", "LEAVE_REJECTED",
                "leaveRequestId", leaveRequestId,
                "employeeId", employeeId,
                "rejectedBy", rejectedBy);
        kafkaTemplate.send(TOPIC, event);
        log.info("Published LEAVE_REJECTED event for request {}", leaveRequestId);
    }
}
