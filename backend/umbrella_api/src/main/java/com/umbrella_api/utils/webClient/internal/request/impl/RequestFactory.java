package com.umbrella_api.utils.webClient.internal.request.impl;

import java.util.Map;

import com.umbrella_api.utils.webClient.internal.request.Request;

public class RequestFactory {
    public static final Map<String, Request> REQUESTS = Map.of("post", new PostRequestEstrategy(), "get",
            new GetRequestEstrategy());

    public static Request requestFactory(String method) {
        Request request = REQUESTS.get(method.toLowerCase());

        if (request == null) {
            throw new IllegalArgumentException(method + " isn't a valid http method");
        }

        return request;
    }
}