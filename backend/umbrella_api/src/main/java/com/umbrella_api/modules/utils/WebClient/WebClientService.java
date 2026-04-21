package com.umbrella_api.modules.utils.WebClient;

import java.util.Map;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.reactive.function.client.WebClient;

import com.fasterxml.jackson.databind.JsonNode;
import com.umbrella_api.modules.utils.WebClient.internal.Request;
import com.umbrella_api.modules.utils.WebClient.internal.impl.RequestFactory;

public class WebClientService {

    private final WebClient webClient;

    private static WebClientService instance;

    private WebClientService() {
        this.webClient = WebClient.builder()
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    public static synchronized WebClientService getInstance() {
        if (instance == null) {
            instance = new WebClientService();
        }
        return instance;
    }

    public JsonNode makeRequest(Map<String, Object> body,
            String apiUrl,
            String httpMethod) {

        Request request = RequestFactory.requestFactory(httpMethod);

        return request.makeRequest(webClient, body, apiUrl);
    }
}