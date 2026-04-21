package com.umbrella_api.modules.utils.WebClient.internal.impl;

import com.umbrella_api.modules.utils.WebClient.internal.Request;

public class RequestFactory {

    public static Request requestFactory(String method) {

        return switch (method.toLowerCase()) {
            case "post" -> new PostRequest();
            case "get" -> new GetRequest();
            default -> throw new IllegalArgumentException("Invalid HTTP method: " + method);
        };
    }
}