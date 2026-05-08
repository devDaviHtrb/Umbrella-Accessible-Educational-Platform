package com.umbrella_api.modules.ai.exceptions;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class AiExceptionHandler {

    @ExceptionHandler(AiApiException.class)
    private ResponseEntity<AiApiExceptionResponse> aiInterfaceError(AiApiException exception) {
        AiApiExceptionResponse responseBody = new AiApiExceptionResponse(exception.getStatus(), exception.getMessage(),
                exception.getCode());
        System.out.println(responseBody);

        return ResponseEntity.status(exception.getCode()).body(responseBody);
    };

}
