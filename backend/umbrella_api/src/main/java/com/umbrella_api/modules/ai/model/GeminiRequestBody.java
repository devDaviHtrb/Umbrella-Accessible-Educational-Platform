package com.umbrella_api.modules.ai.model;

import java.util.List;
import java.util.Map;
import java.util.Objects;

public class GeminiRequestBody {
    public List<Map<String, Object>> contents;
    public Map<String, Object> system_instruction;
    public Map<String, Object> generationConfig;

    public static GeminiRequestBody create(String text, String systemInstruction, int maxTokenOut, double temp) {
        return new Builder()
                .userText(text)
                .instruction(systemInstruction)
                .maxTokens(maxTokenOut)
                .temperature(temp)
                .build();
    }

    private static class Builder {
        private String instruction;
        private String text;
        private Double temp;
        private Integer maxTokens;

        Builder instruction(String i) {
            this.instruction = i;
            return this;
        }

        Builder userText(String t) {
            this.text = Objects.requireNonNull(t, "Empty text");
            return this;
        }

        Builder temperature(Double tmp) {
            this.temp = tmp;
            return this;
        }

        Builder maxTokens(Integer mt) {
            this.maxTokens = mt;
            return this;
        }

        GeminiRequestBody build() {
            var body = new GeminiRequestBody();
            body.contents = List.of(Map.of("parts", List.of(Map.of("text", text))));
            body.system_instruction = Map.of("parts", List.of(Map.of("text", instruction)));
            body.generationConfig = Map.of(
                    "temperature", temp,
                    "maxOutputTokens", maxTokens,
                    "responseMimeType", "application/json");
            return body;
        }
    }

}
