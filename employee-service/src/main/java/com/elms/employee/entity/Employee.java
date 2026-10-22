package com.elms.employee.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "employee")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Employee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, unique = true)
    private Long userId;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(nullable = false)
    private String department;

    @Column(name = "manager_id")
    private Long managerId;

    @Column(name = "join_date")
    private LocalDate joinDate;
}
