package com.umbrella_api.modules.ai.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.umbrella_api.modules.ai.api.AiService;
import com.umbrella_api.modules.ai.dto.AiResponse;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;

@RestController
@RequestMapping("/api/aiTutor")
public class AiController {
    private final AiService aiService;

    public AiController(AiService aiService) {
        this.aiService = aiService;
    }

    @PostMapping
    public ResponseEntity<AiResponse> askAi(@RequestParam("text") String text) {
        AiResponse response = aiService.requestAi(text);

        return ResponseEntity.ok(response);
    }

}
