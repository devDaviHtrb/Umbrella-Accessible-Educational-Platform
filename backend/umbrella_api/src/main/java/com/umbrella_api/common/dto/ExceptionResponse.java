package com.umbrella_api.common.dto;

import java.time.LocalDateTime;

public record ExceptionResponse(String status, String message, int code, LocalDateTime timestamp) {
    public ExceptionResponse(String status, String message, int code) {
        this(status, message, code, LocalDateTime.now());

    }
}
