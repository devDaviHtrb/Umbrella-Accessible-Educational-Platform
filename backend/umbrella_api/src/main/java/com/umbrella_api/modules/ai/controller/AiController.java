package com.umbrella_api.modules.ai.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.umbrella_api.modules.ai.api.AiService;
import com.umbrella_api.modules.ai.dto.AiResponse;

import org.springframework.http.ResponseEntity;

@RestController

@RequestMapping("/api/logged/aiTutor")
public class AiController {
    private final AiService aiService;

    public AiController(AiService aiService) {
        this.aiService = aiService;
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AiResponse> askAi(@RequestParam("text") String text) {
        AiResponse response = aiService.requestAi(text);

        return ResponseEntity.ok(response);
    }

}
