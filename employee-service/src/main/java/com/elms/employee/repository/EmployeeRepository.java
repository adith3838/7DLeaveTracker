package com.elms.employee.repository;

import com.elms.employee.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {
    Optional<Employee> findByUserId(Long userId);

    List<Employee> findByManagerId(Long managerId);

    List<Employee> findByDepartment(String department);
}
