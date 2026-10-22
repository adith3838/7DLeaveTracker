package com.elms.leave.controller;

import com.elms.leave.dto.HolidayDto;
import com.elms.leave.service.HolidayService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/holidays")
@RequiredArgsConstructor
public class HolidayController {

    private final HolidayService holidayService;

    @GetMapping
    public ResponseEntity<List<HolidayDto>> getAllHolidays() {
        return ResponseEntity.ok(holidayService.getAllHolidays());
    }

    @GetMapping("/upcoming")
    public ResponseEntity<List<HolidayDto>> getUpcoming() {
        return ResponseEntity.ok(holidayService.getUpcomingHolidays());
    }

    @PostMapping
    public ResponseEntity<HolidayDto> addHoliday(@RequestBody HolidayDto dto) {
        return ResponseEntity.ok(holidayService.addHoliday(dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteHoliday(@PathVariable Integer id) {
        holidayService.deleteHoliday(id);
        return ResponseEntity.noContent().build();
    }
}
