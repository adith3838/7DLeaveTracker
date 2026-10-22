# Kafka Topics & Events

## Overview
ELMS uses Kafka for asynchronous notifications and decoupling services. All events are serialized as JSON.

## Topics

### `leave-events`
**Partitions:** 3
**Replication Factor:** 2
**Retention:** 7 days

#### Event Types (Headers: `EventType`)

1. **LEAVE_APPLIED**
   - **Producer:** Leave Service
   - **Consumer:** Notification Service
   - **Payload:**
     ```json
     {
       "eventId": "uuid",
       "employeeId": 123,
       "managerId": 456,
       "leaveRequestId": 789,
       "startDate": "2023-10-01",
       "endDate": "2023-10-05",
       "reason": "Family vacation",
       "timestamp": "2023-09-01T10:00:00Z"
     }
     ```

2. **LEAVE_APPROVED**
   - **Producer:** Leave Service
   - **Consumer:** Notification Service
   - **Payload:**
     ```json
     {
       "eventId": "uuid",
       "leaveRequestId": 789,
       "employeeId": 123,
       "approvedBy": 456,
       "timestamp": "2023-09-02T14:00:00Z"
     }
     ```

3. **LEAVE_REJECTED**
   - **Producer:** Leave Service
   - **Consumer:** Notification Service
   - **Payload:**
     ```json
     {
       "eventId": "uuid",
       "leaveRequestId": 789,
       "employeeId": 123,
       "rejectedBy": 456,
       "rejectionReason": "Project deadline conflict",
       "timestamp": "2023-09-02T14:05:00Z"
     }
     ```
