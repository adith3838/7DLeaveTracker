package com.elms.leave.controller;

import com.elms.leave.dto.LeaveBalanceDto;
import com.elms.leave.dto.LeaveRequestDto;
import com.elms.leave.dto.LeaveResponseDto;
import com.elms.leave.service.LeaveService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/leaves")
@RequiredArgsConstructor
public class LeaveController {

    private final LeaveService leaveService;

    @PostMapping
    public ResponseEntity<LeaveResponseDto> applyLeave(
            @RequestHeader("X-Employee-Id") Long employeeId,
            @RequestHeader(value = "X-Manager-Id", required = false) Long managerId,
            @Valid @RequestBody LeaveRequestDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(leaveService.applyLeave(employeeId, managerId, dto));
    }

    @GetMapping
    public ResponseEntity<List<LeaveResponseDto>> getMyLeaves(
            @RequestHeader("X-Employee-Id") Long employeeId) {
        return ResponseEntity.ok(leaveService.getLeavesByEmployee(employeeId));
    }

    @GetMapping("/pending")
    public ResponseEntity<List<LeaveResponseDto>> getPending(
            @RequestParam List<Long> reporteeIds) {
        return ResponseEntity.ok(leaveService.getPendingForManager(reporteeIds));
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<LeaveResponseDto> approve(
            @PathVariable Long id,
            @RequestHeader("X-Employee-Id") Long approverId) {
        return ResponseEntity.ok(leaveService.approveLeave(id, approverId));
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<LeaveResponseDto> reject(
            @PathVariable Long id,
            @RequestHeader("X-Employee-Id") Long rejectedBy) {
        return ResponseEntity.ok(leaveService.rejectLeave(id, rejectedBy));
    }

    @GetMapping("/balance")
    public ResponseEntity<List<LeaveBalanceDto>> getBalance(
            @RequestHeader("X-Employee-Id") Long employeeId) {
        return ResponseEntity.ok(leaveService.getBalance(employeeId));
    }
}
