package com.umbrella_api.modules.utils.WebClient.internal.impl;

import java.util.Map;

import org.springframework.web.reactive.function.client.WebClient;

import com.fasterxml.jackson.databind.JsonNode;
import com.umbrella_api.modules.utils.WebClient.internal.Request;

class GetRequestEstrategy implements Request {
    public JsonNode makeRequest(WebClient client, Map<String, Object> body, String apiUrl) {
        JsonNode root = client.get()
                .uri(apiUrl)
                .retrieve()
                .bodyToMono(JsonNode.class)
                .block();

        return root;
    }
}