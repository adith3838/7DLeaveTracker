package com.elms.leave.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "leave_type")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeaveType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, unique = true, length = 30)
    private String name;

    @Column(name = "default_allowance", nullable = false)
    private Integer defaultAllowance;

    @Builder.Default
    @Column(name = "carry_forward", nullable = false)
    private Boolean carryForward = false;
}
