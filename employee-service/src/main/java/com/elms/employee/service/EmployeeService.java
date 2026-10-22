package com.elms.employee.service;

import com.elms.employee.dto.EmployeeDto;
import com.elms.employee.entity.Employee;
import com.elms.employee.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EmployeeService {

    private final EmployeeRepository employeeRepository;

    public EmployeeDto getById(Long id) {
        Employee emp = employeeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employee not found"));
        return toDto(emp);
    }

    public EmployeeDto getByUserId(Long userId) {
        Employee emp = employeeRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));
        return toDto(emp);
    }

    public List<EmployeeDto> getDirectReports(Long managerId) {
        return employeeRepository.findByManagerId(managerId)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public EmployeeDto createEmployee(EmployeeDto dto) {
        Employee emp = Employee.builder()
                .userId(dto.getUserId())
                .fullName(dto.getFullName())
                .department(dto.getDepartment())
                .managerId(dto.getManagerId())
                .joinDate(dto.getJoinDate())
                .build();
        return toDto(employeeRepository.save(emp));
    }

    public EmployeeDto updateEmployee(Long id, EmployeeDto dto) {
        Employee emp = employeeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employee not found"));
        emp.setFullName(dto.getFullName());
        emp.setDepartment(dto.getDepartment());
        emp.setManagerId(dto.getManagerId());
        return toDto(employeeRepository.save(emp));
    }

    private EmployeeDto toDto(Employee emp) {
        String managerName = null;
        if (emp.getManagerId() != null) {
            managerName = employeeRepository.findById(emp.getManagerId())
                    .map(Employee::getFullName)
                    .orElse(null);
        }
        return EmployeeDto.builder()
                .id(emp.getId())
                .userId(emp.getUserId())
                .fullName(emp.getFullName())
                .department(emp.getDepartment())
                .managerId(emp.getManagerId())
                .managerName(managerName)
                .joinDate(emp.getJoinDate())
                .build();
    }
}
