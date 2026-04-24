package com.umbrella_api.modules.utils.WebClient.internal;

import com.fasterxml.jackson.databind.JsonNode;

import java.util.Map;

import org.springframework.web.reactive.function.client.WebClient;

public interface Request {
    JsonNode makeRequest(WebClient client, Map<String, Object> body, String apiUrl);
}
