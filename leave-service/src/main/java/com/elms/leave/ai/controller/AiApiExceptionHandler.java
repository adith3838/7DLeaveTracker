package com.elms.leave.ai.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice(basePackages = "com.elms.leave.ai.controller")
public class AiApiExceptionHandler {

    @ExceptionHandler(AccessDeniedException.class)
    ResponseEntity<Map<String, String>> accessDenied(AccessDeniedException exception) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("error", exception.getMessage()));
    }

    @ExceptionHandler({IllegalArgumentException.class, MethodArgumentNotValidException.class})
    ResponseEntity<Map<String, String>> badRequest(Exception exception) {
        String message = exception instanceof MethodArgumentNotValidException validation &&
                validation.getBindingResult().getFieldError() != null
                ? validation.getBindingResult().getFieldError().getDefaultMessage()
                : exception.getMessage();
        return ResponseEntity.badRequest().body(Map.of("error", message == null ? "Invalid request." : message));
    }

    @ExceptionHandler(IllegalStateException.class)
    ResponseEntity<Map<String, String>> conflict(IllegalStateException exception) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", exception.getMessage()));
    }
}
