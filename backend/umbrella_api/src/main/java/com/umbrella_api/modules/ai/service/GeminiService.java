package com.umbrella_api.modules.ai.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.JsonNode;
import com.umbrella_api.modules.utils.WebClient.WebClientService;

import java.util.List;
import java.util.Map;

@Service
public class GeminiService {

    private final WebClientService webClientService;

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.api.url}")
    private String geminiUrl;

    public GeminiService(WebClientService webClientService) {
        this.webClientService = webClientService;
    }

    // return a json like {code:"", reply:"", provider:""} or {code:"", reply:"",
    // provider:"", error:""}
    public Map<String, Object> requestAi(String text) {

        String apiUrl = geminiUrl + apiKey;

        Map<String, Object> body = Map.of(
                "contents", List.of(
                        Map.of(
                                "parts", List.of(
                                        Map.of("text", text)))));

        try {
            JsonNode response = webClientService.makeRequest(body, apiUrl, "post");

            String reply = response.path("candidates")
                    .get(0)
                    .path("content")
                    .path("parts")
                    .get(0)
                    .path("text")
                    .asText();

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