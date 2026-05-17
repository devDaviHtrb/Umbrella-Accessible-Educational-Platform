package com.umbrella_api.common.infra;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.ExceptionHandler;

import com.umbrella_api.common.dto.ExceptionResponse;

import jakarta.persistence.EntityNotFoundException;

public class GlobalExceptionHandler {
    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<ExceptionResponse> handleNotFound(EntityNotFoundException ex) {
        ExceptionResponse error = new ExceptionResponse(
                "Not Found",
                ex.getMessage() != null ? ex.getMessage() : "Resource not found.",
                HttpStatus.NOT_FOUND.value());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ExceptionResponse> handleBadRequest(IllegalArgumentException ex) {
        ExceptionResponse error = new ExceptionResponse(
                "Bad Request",
                ex.getMessage(),
                HttpStatus.BAD_REQUEST.value());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ExceptionResponse> handleAccessDenied(AccessDeniedException ex) {
        ExceptionResponse error = new ExceptionResponse(
                "Forbidden",
                "You do not have permission to access this resource.",
                HttpStatus.FORBIDDEN.value());
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ExceptionResponse> handleAuthentication(AuthenticationException ex) {
        ExceptionResponse error = new ExceptionResponse(
                "Unauthorized",
                "Authentication failed: " + ex.getMessage(),
                HttpStatus.UNAUTHORIZED.value());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
    }
}
