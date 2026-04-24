package com.umbrella_api.modules.utils.WebClient.internal;

import com.fasterxml.jackson.databind.JsonNode;
import com.umbrella_api.modules.ai.model.GeminiRequestBody;

import org.springframework.web.reactive.function.client.WebClient;

public interface Request {
    JsonNode makeRequest(WebClient client, GeminiRequestBody body, String apiUrl);
}
