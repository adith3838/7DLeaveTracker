package com.elms.leave.repository;

import com.elms.leave.entity.LeaveBalance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LeaveBalanceRepository extends JpaRepository<LeaveBalance, Long> {
    List<LeaveBalance> findByEmployeeIdAndYear(Long employeeId, Integer year);

    Optional<LeaveBalance> findByEmployeeIdAndLeaveTypeIdAndYear(Long employeeId, Integer leaveTypeId, Integer year);
}
