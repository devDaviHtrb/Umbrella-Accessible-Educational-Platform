package com.umbrella_api.modules.FileDb.infra;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.umbrella_api.modules.FileDb.exceptions.FileDbException;

@RestControllerAdvice
public class FileDbExceptionHandler {

    @ExceptionHandler(FileDbException.class)
    private ResponseEntity<Map<String, Object>> aiInterfaceError(FileDbException exception) {
        Map<String, Object> responseBody = new HashMap<>();
        responseBody.put("status", exception.getStatus());
        responseBody.put("message", exception.getMessage());
        responseBody.put("code", exception.getCode());
        System.out.println(responseBody);

        return ResponseEntity.status(exception.getCode()).body(responseBody);
    };

}
