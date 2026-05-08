package com.umbrella_api.modules.FileDb.exceptions;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class FileDbExceptionHandler {

    @ExceptionHandler(FileDbException.class)
    private ResponseEntity<FileDbExceptionResponse> aiInterfaceError(FileDbException exception) {

        FileDbExceptionResponse responseBody = new FileDbExceptionResponse(exception.getStatus(),
                exception.getMessage(), exception.getCode());
        return ResponseEntity.status(exception.getCode()).body(responseBody);

    };

}
