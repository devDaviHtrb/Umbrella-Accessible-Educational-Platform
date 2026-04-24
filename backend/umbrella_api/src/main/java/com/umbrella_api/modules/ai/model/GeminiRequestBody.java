package com.umbrella_api.modules.ai.model;

import java.util.List;
import java.util.Map;
import java.util.Objects;

import com.umbrella_api.modules.ai.config.GeminiServiceConfig;

public class GeminiRequestBody {
    public List<Map<String, Object>> contents;
    public Map<String, Object> system_instruction;
    public Map<String, Object> generationConfig;

    public static GeminiRequestBody create(String text, GeminiServiceConfig.Config config) {
        return new Builder()
                .userText(text)
                .instruction(config.systemInstruction())
                .maxTokens(config.maxTokenOut())
                .temperature(config.temp())
                .build();
    }

    private static class Builder {
        private String systemInstruction;
        private String text;
        private Double temp;
        private Integer maxTokensOut;

        Builder instruction(String systemInstruction) {
            this.systemInstruction = systemInstruction;
            return this;
        }

        Builder userText(String text) {
            this.text = Objects.requireNonNull(text, "Empty text");
            return this;
        }

        Builder temperature(Double temp) {
            this.temp = temp;
            return this;
        }

        Builder maxTokens(Integer maxTokensOut) {
            this.maxTokensOut = maxTokensOut;
            return this;
        }

        GeminiRequestBody build() {
            var body = new GeminiRequestBody();
            body.contents = List.of(Map.of("parts", List.of(Map.of("text", this.text))));
            body.system_instruction = Map.of("parts", List.of(Map.of("text", this.systemInstruction)));
            body.generationConfig = Map.of(
                    "temperature", this.temp,
                    "maxOutputTokens", this.maxTokensOut);
            return body;
        }
    }

}
