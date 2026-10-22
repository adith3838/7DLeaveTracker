package com.elms.employee.controller;

import com.elms.employee.dto.EmployeeDto;
import com.elms.employee.service.EmployeeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/employees")
@RequiredArgsConstructor
public class EmployeeController {

    private final EmployeeService employeeService;

    @GetMapping("/{id}")
    public ResponseEntity<EmployeeDto> getEmployee(@PathVariable Long id) {
        return ResponseEntity.ok(employeeService.getById(id));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<EmployeeDto> getByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(employeeService.getByUserId(userId));
    }

    @GetMapping("/reports/{managerId}")
    public ResponseEntity<List<EmployeeDto>> getDirectReports(@PathVariable Long managerId) {
        return ResponseEntity.ok(employeeService.getDirectReports(managerId));
    }

    @PostMapping
    public ResponseEntity<EmployeeDto> createEmployee(@RequestBody EmployeeDto dto) {
        return ResponseEntity.ok(employeeService.createEmployee(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<EmployeeDto> updateEmployee(@PathVariable Long id, @RequestBody EmployeeDto dto) {
        return ResponseEntity.ok(employeeService.updateEmployee(id, dto));
    }
}
