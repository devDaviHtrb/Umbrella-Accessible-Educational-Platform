package com.umbrella_api.modules.utils.WebClient;

import java.util.Map;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import com.fasterxml.jackson.databind.JsonNode;
import com.umbrella_api.modules.ai.model.GeminiRequestBody;
import com.umbrella_api.modules.utils.WebClient.internal.Request;
import com.umbrella_api.modules.utils.WebClient.internal.impl.RequestFactory;

@Component
public class WebClientService {

    private final WebClient webClient;

    public WebClientService() {
        this.webClient = WebClient.builder()
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    public JsonNode makeRequest(
            GeminiRequestBody body,
            String apiUrl,
            String httpMethod) {

        Request request = RequestFactory.requestFactory(httpMethod);

        return request.makeRequest(webClient, body, apiUrl);
    }
}