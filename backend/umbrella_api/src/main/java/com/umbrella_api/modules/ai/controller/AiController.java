package com.umbrella_api.modules.ai.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.umbrella_api.modules.ai.dto.AiResponse;
import com.umbrella_api.modules.ai.service.GeminiService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;

@RestController
@RequestMapping("/aiTutor")
public class AiController {
    private final GeminiService geminiService;

    public AiController(GeminiService geminiService) {
        this.geminiService = geminiService;
    }

    @PostMapping("/ask")
    public ResponseEntity<AiResponse> askAi(@RequestParam("text") String text) {
        AiResponse response = geminiService.requestAi(text);

        return ResponseEntity.ok(response);
    }

}
