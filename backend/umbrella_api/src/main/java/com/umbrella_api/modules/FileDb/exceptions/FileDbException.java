package com.umbrella_api.modules.FileDb.exceptions;

import lombok.Getter;

@Getter
public class FileDbException extends RuntimeException {
    private int code;
    private String status;

    public FileDbException(String message, int code, String status) {
        super(message);
        this.code = code;
        this.status = status;
    }

}
