package com.umbrella_api.modules.storage.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Configuração do worker de legendas (serviço Python `transformer`).
 *
 * Lida de `transformer.*` no application.yaml. No docker-compose o worker é
 * acessível em `http://transformer:8000`.
 */
@ConfigurationProperties(prefix = "transformer")
public record TransformerProperties(
        String baseUrl,
        Integer timeoutSeconds,
        String geminiKey) {

    public String baseUrl() {
        return baseUrl != null ? baseUrl : "http://transformer:8000";
    }

    public Integer timeoutSeconds() {
        return timeoutSeconds != null ? timeoutSeconds : 1800;
    }

    /** Chave Gemini dedicada ao worker (distinta da do tutor IA). */
    public String geminiKey() {
        return geminiKey;
    }
}
