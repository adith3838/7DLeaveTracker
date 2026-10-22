package com.elms.leave.repository;

import com.elms.leave.entity.LeaveRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, Long> {
    List<LeaveRequest> findByEmployeeId(Long employeeId);

    List<LeaveRequest> findByEmployeeIdIn(List<Long> employeeIds);

    List<LeaveRequest> findByEmployeeIdInAndStatus(List<Long> employeeIds, LeaveRequest.LeaveStatus status);

    boolean existsByEmployeeIdAndStartDateLessThanEqualAndEndDateGreaterThanEqualAndStatusNot(
            Long employeeId, LocalDate endDate, LocalDate startDate, LeaveRequest.LeaveStatus status);
}
