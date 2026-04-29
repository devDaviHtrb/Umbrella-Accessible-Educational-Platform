package com.umbrella_api.modules.utils.WebClient.internal.impl;

import org.springframework.http.HttpStatusCode;
import org.springframework.web.reactive.function.client.WebClient;

import com.fasterxml.jackson.databind.JsonNode;
import com.umbrella_api.modules.ai.model.GeminiRequestBody;
import com.umbrella_api.modules.utils.WebClient.internal.Request;

import reactor.core.publisher.Mono;

class GetRequestEstrategy implements Request {
    public JsonNode makeRequest(WebClient client, GeminiRequestBody body, String apiUrl) {
        JsonNode root = client.get()
                .uri(apiUrl)
                .retrieve()
                .onStatus(HttpStatusCode::isError, clientResponse -> Mono.empty())
                .bodyToMono(JsonNode.class)
                .block();

        return root;
    }
}