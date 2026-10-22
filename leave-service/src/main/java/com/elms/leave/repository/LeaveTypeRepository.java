package com.elms.leave.repository;

import com.elms.leave.entity.LeaveType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LeaveTypeRepository extends JpaRepository<LeaveType, Integer> {
    Optional<LeaveType> findByName(String name);
}
