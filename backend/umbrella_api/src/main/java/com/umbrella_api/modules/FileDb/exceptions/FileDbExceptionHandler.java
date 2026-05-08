package com.umbrella_api.modules.FileDb.exceptions;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.umbrella_api.common.dto.ExceptionResponse;

@RestControllerAdvice
public class FileDbExceptionHandler {

    @ExceptionHandler(FileDbException.class)
    private ResponseEntity<ExceptionResponse> aiInterfaceError(FileDbException exception) {

        ExceptionResponse responseBody = new ExceptionResponse(exception.getStatus(),
                exception.getMessage(), exception.getCode());
        return ResponseEntity.status(exception.getCode()).body(responseBody);

    };

}
