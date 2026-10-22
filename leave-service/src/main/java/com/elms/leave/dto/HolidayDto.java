package com.elms.leave.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HolidayDto {
    private Integer id;
    private LocalDate date;
    private String name;
    private Boolean isOptional;
}
