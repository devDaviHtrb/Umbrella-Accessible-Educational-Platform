package com.umbrella_api.modules.ai.service;

import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.JsonNode;
import com.umbrella_api.modules.ai.config.GeminiServiceConfig;
import com.umbrella_api.modules.ai.model.GeminiRequestBody;
import com.umbrella_api.modules.utils.WebClient.WebClientService;

import java.util.Map;
import java.util.Objects;

@Service
public class GeminiService {

    private final WebClientService webClientService;
    private final GeminiServiceConfig.Api geminiApi;
    private final GeminiServiceConfig.Config geminiConfig;
    private final GeminiServiceConfig geminiServiceConfig;

    public GeminiService(WebClientService webClientService, GeminiServiceConfig geminiServiceConfig,
            GeminiRequestBody geminiRequestBody) {
        this.geminiServiceConfig = geminiServiceConfig;
        this.geminiConfig = geminiServiceConfig.config();
        this.geminiApi = geminiServiceConfig.api();
        this.webClientService = webClientService;
    }

    // return a json like {code:"", reply:"", provider:""} or {code:"", reply:"",
    // provider:"", error:""}
    public Map<String, Object> requestAi(String text) {

        String apiUrl = Objects.requireNonNull(geminiApi.getCompleteUrl(), "null ai api url or key");

        GeminiRequestBody body = GeminiRequestBody.create(text, geminiConfig.systemIntruction(),
                geminiConfig.maxTokenOut(), geminiConfig.temp());

        try {
            JsonNode response = webClientService.makeRequest(body, apiUrl, "post");

            // Json path
            String reply = response.at("/candidates/0/content/parts/0/text").asText();

            return Map.of(
                    "code", 200,
                    "reply", reply,
                    "provider", "gemini");

        } catch (Exception e) {

            return Map.of(
                    "code", 500,
                    "reply", "",
                    "provider", "gemini",
                    "error", e.getMessage());
        }
    }
}