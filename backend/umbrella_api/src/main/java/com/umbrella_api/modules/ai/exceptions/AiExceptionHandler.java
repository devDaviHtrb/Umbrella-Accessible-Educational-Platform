package com.umbrella_api.modules.ai.exceptions;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.umbrella_api.common.dto.ExceptionResponse;

@RestControllerAdvice
public class AiExceptionHandler {

    @ExceptionHandler(AiApiException.class)
    private ResponseEntity<ExceptionResponse> aiInterfaceError(AiApiException exception) {
        ExceptionResponse responseBody = new ExceptionResponse(exception.getStatus(), exception.getMessage(),
                exception.getCode());
        System.out.println(responseBody);

        return ResponseEntity.status(exception.getCode()).body(responseBody);
    };

}
