package com.umbrella_api.modules.ai.dto;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;

import com.umbrella_api.modules.ai.config.GeminiData;

public class GeminiRequestBody {
    public List<Map<String, Object>> contents;
    public Map<String, Object> system_instruction;
    public Map<String, Object> generationConfig;

    public static GeminiRequestBody create(String text, GeminiData.Config config) {
        return new Builder()
                .userText(text)
                .instruction(config.systemInstruction())
                .maxTokens(config.maxTokenOut())
                .temperature(config.temp())
                .build();
    }

    public static GeminiRequestBody createWithHistory(String summary, List<Map<String, String>> history, GeminiData.Config config) {
        return new Builder()
                .contextSummary(summary)
                .chatHistory(history)
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
        private String summary;
        private List<Map<String, String>> history = List.of();

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

        Builder contextSummary(String summary) {
            this.summary = summary;
            return this;
        }

        Builder chatHistory(List<Map<String, String>> history) {
            if (history != null) {
                this.history = history;
            }
            return this;
        }

        GeminiRequestBody build() {
            var body = new GeminiRequestBody();
            List<Map<String, Object>> contentsList = new ArrayList<>();

            if (this.summary != null && !this.summary.trim().isEmpty() && !this.summary.equalsIgnoreCase("\"\"")) {
                String formattedSummary = "[CHAT CONTEXT: " + this.summary + "]";
                contentsList.add(Map.of(
                        "role", "user",
                        "parts", List.of(Map.of("text", formattedSummary))
                ));
                contentsList.add(Map.of(
                        "role", "model",
                        "parts", List.of(Map.of("text", "Understood. I am aware of the student's progress so far and ready to continue helping."))
                ));
            }

            for (Map<String, String> msg : this.history) {
                contentsList.add(Map.of(
                        "role", msg.get("role"),
                        "parts", List.of(Map.of("text", msg.get("content")))
                ));
            }

            if (this.text != null) {
                contentsList.add(Map.of(
                        "role", "user",
                        "parts", List.of(Map.of("text", this.text))
                ));
            }

            body.contents = contentsList;
            body.system_instruction = Map.of("parts", List.of(Map.of("text", this.systemInstruction)));
            body.generationConfig = Map.of(
                    "temperature", this.temp,
                    "maxOutputTokens", this.maxTokensOut);
            return body;
        }
    }
}
