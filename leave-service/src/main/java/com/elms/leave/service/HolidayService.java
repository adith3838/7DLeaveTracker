package com.elms.leave.service;

import com.elms.leave.dto.HolidayDto;
import com.elms.leave.entity.Holiday;
import com.elms.leave.repository.HolidayRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class HolidayService {

    private final HolidayRepository holidayRepository;

    public List<HolidayDto> getUpcomingHolidays() {
        LocalDate now = LocalDate.now();
        LocalDate endOfYear = LocalDate.of(now.getYear(), 12, 31);
        return holidayRepository.findByDateBetween(now, endOfYear)
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    public List<HolidayDto> getAllHolidays() {
        return holidayRepository.findAll()
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    public HolidayDto addHoliday(HolidayDto dto) {
        Holiday holiday = Holiday.builder()
                .date(dto.getDate())
                .name(dto.getName())
                .isOptional(dto.getIsOptional() != null ? dto.getIsOptional() : false)
                .build();
        return toDto(holidayRepository.save(holiday));
    }

    public void deleteHoliday(Integer id) {
        holidayRepository.deleteById(id);
    }

    private HolidayDto toDto(Holiday h) {
        return HolidayDto.builder()
                .id(h.getId())
                .date(h.getDate())
                .name(h.getName())
                .isOptional(h.getIsOptional())
                .build();
    }
}
