package com.elms.leave.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "holidays")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Holiday {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "holiday_date", nullable = false)
    private LocalDate date;

    @Column(nullable = false)
    private String name;

    @Builder.Default
    @Column(name = "is_optional", nullable = false)
    private Boolean isOptional = false;
}
