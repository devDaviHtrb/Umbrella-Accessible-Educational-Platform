package com.umbrella_api.modules.ai.infra;

import java.util.Objects;

import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.JsonNode;
import com.umbrella_api.modules.ai.config.GeminiData;
import com.umbrella_api.modules.ai.config.GeminiData.Api;
import com.umbrella_api.modules.ai.config.GeminiData.Config;
import com.umbrella_api.modules.ai.dto.AiResponse;
import com.umbrella_api.modules.ai.dto.GeminiRequestBody;
import com.umbrella_api.modules.ai.exceptions.AiApiException;
import com.umbrella_api.modules.utils.WebClient.WebClientService;

@Component
public class GeminiProvider {
    private final WebClientService webClientService;
    private final GeminiData.Api geminiApi;
    private final GeminiData.Config geminiConfig;
    private final GeminiData geminiServiceConfig;

    public GeminiProvider(WebClientService webClientService, Api geminiApi, Config geminiConfig,
            GeminiData geminiServiceConfig) {
        this.webClientService = webClientService;
        this.geminiApi = geminiApi;
        this.geminiConfig = geminiConfig;
        this.geminiServiceConfig = geminiServiceConfig;
    }

    public AiResponse requestAi(String text) {

        String apiUrl = Objects.requireNonNull(geminiApi.getCompleteUrl(), "null ai api url or key");

        GeminiRequestBody body = GeminiRequestBody.create(text, geminiConfig);
        JsonNode response = webClientService.makeRequest(body, apiUrl, "post");

        if (response.has("error")) {
            System.out.println("erro na api");
            throw new AiApiException(response.at("/error/message").asText(), response.at("/error/code").asInt(),
                    response.at("/error/status").asText());
        }

        String reply = response.at("/candidates/0/content/parts/0/text").asText();

        return new AiResponse(200, reply, "gemini");
    }
}
