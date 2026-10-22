package com.elms.employee.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeDto {
    private Long id;
    private Long userId;
    private String fullName;
    private String email;
    private String department;
    private Long managerId;
    private String managerName;
    private LocalDate joinDate;
    private String role;
}
