package com.umbrella_api.modules.ai.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "gemini")
public record GeminiServiceConfig(Api api, Config config) {
    public record Api(String url, String key) {
        public String getCompleteUrl() {
            return url == null || key == null ? null : url + key;
        }
    }

    public record Config(int maxTokenOut, String systemIntruction, double temp) {
    }

}