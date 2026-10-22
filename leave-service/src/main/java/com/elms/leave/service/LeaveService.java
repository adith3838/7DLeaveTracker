package com.elms.leave.service;

import com.elms.leave.dto.LeaveBalanceDto;
import com.elms.leave.dto.LeaveRequestDto;
import com.elms.leave.dto.LeaveResponseDto;
import com.elms.leave.entity.LeaveBalance;
import com.elms.leave.entity.LeaveRequest;
import com.elms.leave.entity.LeaveType;
import com.elms.leave.kafka.LeaveEventProducer;
import com.elms.leave.repository.HolidayRepository;
import com.elms.leave.repository.LeaveBalanceRepository;
import com.elms.leave.repository.LeaveRequestRepository;
import com.elms.leave.repository.LeaveTypeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.Year;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LeaveService {

    private final LeaveRequestRepository leaveRequestRepository;
    private final LeaveTypeRepository leaveTypeRepository;
    private final LeaveBalanceRepository leaveBalanceRepository;
    private final HolidayRepository holidayRepository;
    private final LeaveEventProducer leaveEventProducer;

    @Transactional
    public LeaveResponseDto applyLeave(Long employeeId, Long managerId, LeaveRequestDto dto) {
        // Validate leave type
        LeaveType leaveType = leaveTypeRepository.findByName(dto.getLeaveType())
                .orElseThrow(() -> new RuntimeException("Invalid leave type: " + dto.getLeaveType()));

        // Validate dates
        if (dto.getStartDate().isAfter(dto.getEndDate())) {
            throw new RuntimeException("Start date must be before end date");
        }
        if (dto.getStartDate().isBefore(LocalDate.now())) {
            throw new RuntimeException("Cannot apply for past dates");
        }

        // Check overlapping leaves
        boolean overlap = leaveRequestRepository
                .existsByEmployeeIdAndStartDateLessThanEqualAndEndDateGreaterThanEqualAndStatusNot(
                        employeeId, dto.getEndDate(), dto.getStartDate(), LeaveRequest.LeaveStatus.CANCELLED);
        if (overlap) {
            throw new RuntimeException("Overlapping leave request exists");
        }

        // Calculate working days (exclude weekends and holidays)
        int leaveDays = calculateLeaveDays(dto.getStartDate(), dto.getEndDate());
        if (leaveDays <= 0) {
            throw new RuntimeException("No working days in the selected range");
        }

        // Check balance
        int currentYear = Year.now().getValue();
        LeaveBalance balance = leaveBalanceRepository
                .findByEmployeeIdAndLeaveTypeIdAndYear(employeeId, leaveType.getId(), currentYear)
                .orElseThrow(() -> new RuntimeException("No leave balance found. Contact HR."));

        if (balance.getRemainingBalance() < leaveDays) {
            throw new RuntimeException("Insufficient leave balance. Available: " + balance.getRemainingBalance());
        }

        // Create leave request
        LeaveRequest request = LeaveRequest.builder()
                .employeeId(employeeId)
                .leaveType(leaveType)
                .startDate(dto.getStartDate())
                .endDate(dto.getEndDate())
                .reason(dto.getReason())
                .status(LeaveRequest.LeaveStatus.PENDING)
                .build();

        LeaveRequest saved = leaveRequestRepository.save(request);

        // Publish Kafka event
        leaveEventProducer.sendLeaveApplied(saved.getId(), employeeId, managerId);

        return toResponseDto(saved);
    }

    public List<LeaveResponseDto> getLeavesByEmployee(Long employeeId) {
        return leaveRequestRepository.findByEmployeeId(employeeId)
                .stream().map(this::toResponseDto).collect(Collectors.toList());
    }

    public List<LeaveResponseDto> getPendingForManager(List<Long> reporteeIds) {
        return leaveRequestRepository
                .findByEmployeeIdInAndStatus(reporteeIds, LeaveRequest.LeaveStatus.PENDING)
                .stream().map(this::toResponseDto).collect(Collectors.toList());
    }

    @Transactional
    public LeaveResponseDto approveLeave(Long leaveId, Long approverId) {
        LeaveRequest request = leaveRequestRepository.findById(leaveId)
                .orElseThrow(() -> new RuntimeException("Leave request not found"));

        if (request.getStatus() != LeaveRequest.LeaveStatus.PENDING) {
            throw new RuntimeException("Leave is not in PENDING status");
        }

        request.setStatus(LeaveRequest.LeaveStatus.APPROVED);
        request.setApprovedBy(approverId);
        LeaveRequest saved = leaveRequestRepository.save(request);

        // Deduct balance
        int days = calculateLeaveDays(request.getStartDate(), request.getEndDate());
        LeaveBalance balance = leaveBalanceRepository
                .findByEmployeeIdAndLeaveTypeIdAndYear(
                        request.getEmployeeId(), request.getLeaveType().getId(), Year.now().getValue())
                .orElseThrow();
        balance.setRemainingBalance(balance.getRemainingBalance() - days);
        leaveBalanceRepository.save(balance);

        leaveEventProducer.sendLeaveApproved(saved.getId(), saved.getEmployeeId(), approverId);
        return toResponseDto(saved);
    }

    @Transactional
    public LeaveResponseDto rejectLeave(Long leaveId, Long rejectedBy) {
        LeaveRequest request = leaveRequestRepository.findById(leaveId)
                .orElseThrow(() -> new RuntimeException("Leave request not found"));

        if (request.getStatus() != LeaveRequest.LeaveStatus.PENDING) {
            throw new RuntimeException("Leave is not in PENDING status");
        }

        request.setStatus(LeaveRequest.LeaveStatus.REJECTED);
        request.setApprovedBy(rejectedBy);
        LeaveRequest saved = leaveRequestRepository.save(request);

        leaveEventProducer.sendLeaveRejected(saved.getId(), saved.getEmployeeId(), rejectedBy);
        return toResponseDto(saved);
    }

    public List<LeaveBalanceDto> getBalance(Long employeeId) {
        int year = Year.now().getValue();
        return leaveBalanceRepository.findByEmployeeIdAndYear(employeeId, year)
                .stream()
                .map(b -> LeaveBalanceDto.builder()
                        .leaveType(b.getLeaveType().getName())
                        .remainingBalance(b.getRemainingBalance())
                        .year(b.getYear())
                        .build())
                .collect(Collectors.toList());
    }

    private int calculateLeaveDays(LocalDate start, LocalDate end) {
        int count = 0;
        LocalDate date = start;
        while (!date.isAfter(end)) {
            if (date.getDayOfWeek() != DayOfWeek.SATURDAY
                    && date.getDayOfWeek() != DayOfWeek.SUNDAY
                    && !holidayRepository.existsByDate(date)) {
                count++;
            }
            date = date.plusDays(1);
        }
        return count;
    }

    private LeaveResponseDto toResponseDto(LeaveRequest req) {
        return LeaveResponseDto.builder()
                .id(req.getId())
                .employeeId(req.getEmployeeId())
                .leaveType(req.getLeaveType().getName())
                .startDate(req.getStartDate())
                .endDate(req.getEndDate())
                .status(req.getStatus().name())
                .reason(req.getReason())
                .createdAt(req.getCreatedAt())
                .approvedBy(req.getApprovedBy())
                .build();
    }
}
