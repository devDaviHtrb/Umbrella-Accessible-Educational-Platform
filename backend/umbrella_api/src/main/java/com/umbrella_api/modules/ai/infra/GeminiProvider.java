package com.umbrella_api.modules.ai.infra;

import java.util.Objects;

import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.JsonNode;
import com.umbrella_api.modules.ai.config.GeminiData;
import com.umbrella_api.modules.ai.dto.AiResponse;
import com.umbrella_api.modules.ai.dto.GeminiRequestBody;
import com.umbrella_api.utils.webClient.WebClientUtil;

@Component
public class GeminiProvider {
    private final WebClientUtil webClientService;
    private final GeminiData.Api geminiApi;
    private final GeminiData.Config geminiConfig;
    private final GeminiData geminiServiceConfig;

    public GeminiProvider(WebClientUtil webClientService,
            GeminiData geminiServiceConfig) {
        this.webClientService = webClientService;
        this.geminiApi = geminiServiceConfig.api();
        this.geminiConfig = geminiServiceConfig.config();
        this.geminiServiceConfig = geminiServiceConfig;
    }

    public AiResponse requestAi(String text) {

        String apiUrl = Objects.requireNonNull(geminiApi.getCompleteUrl(), "null ai api url or key");

        GeminiRequestBody body = GeminiRequestBody.create(text, geminiConfig);
        JsonNode response = webClientService.makeRequest(body, apiUrl, "post");

        if (response.has("error")) {
            System.out.println("erro na api");
            throw new IllegalStateException("Ai provider integration failed.");
        }

        String reply = response.at("/candidates/0/content/parts/0/text").asText();

        return new AiResponse(200, reply, "gemini");
    }
}
