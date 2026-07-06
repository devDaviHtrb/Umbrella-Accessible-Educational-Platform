package com.umbrella_api.utils.webClient.internal;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import com.fasterxml.jackson.databind.JsonNode;
import com.umbrella_api.modules.ai.dto.GeminiRequestBody;
import com.umbrella_api.utils.webClient.WebClientUtil;
import com.umbrella_api.utils.webClient.internal.request.Request;
import com.umbrella_api.utils.webClient.internal.request.impl.RequestFactory;

@Component
public class WebClientService implements WebClientUtil {

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