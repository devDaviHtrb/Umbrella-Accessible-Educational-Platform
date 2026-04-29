package com.umbrella_api.modules.ai.exceptions;

import lombok.Getter;

@Getter
public class AiApiException extends RuntimeException {
    private final int code;
    private final String status;

    public AiApiException(String message, int code, String status) {
        super(message);
        this.code = code;
        this.status = status;
    }

}
