package com.umbrella_api.utils.webClient;

import com.fasterxml.jackson.databind.JsonNode;
import com.umbrella_api.modules.ai.dto.GeminiRequestBody;

public interface WebClientUtil {
    public JsonNode makeRequest(
            GeminiRequestBody body,
            String apiUrl,
            String httpMethod);
}
