package com.elms.leave.repository;

import com.elms.leave.entity.Holiday;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface HolidayRepository extends JpaRepository<Holiday, Integer> {
    List<Holiday> findByDateBetween(LocalDate start, LocalDate end);

    boolean existsByDate(LocalDate date);
}
