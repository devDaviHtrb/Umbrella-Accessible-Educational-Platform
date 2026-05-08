package com.umbrella_api.modules.ai.service;

import org.springframework.stereotype.Service;

import com.umbrella_api.modules.ai.api.AiService;
import com.umbrella_api.modules.ai.infra.GeminiProvider;
import java.util.Map;

@Service
public class GeminiService implements AiService {

    private final GeminiProvider geminiProvider;

    public GeminiService(GeminiProvider geminiProvider) {
        this.geminiProvider = geminiProvider;
    }

    // return a json like {code:"", reply:"", provider:""} or a AiApiException
    public Map<String, Object> requestAi(String text) {
        return geminiProvider.requestAi(text);
    }
}