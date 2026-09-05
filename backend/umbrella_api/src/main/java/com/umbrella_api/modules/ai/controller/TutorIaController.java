package com.umbrella_api.modules.ai.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PostAuthorize;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.umbrella_api.common.security.CustomUserDetails;
import com.umbrella_api.modules.ai.api.AiService;
import com.umbrella_api.modules.ai.model.IaChat;
import com.umbrella_api.modules.ai.model.TutorIaInteractions;

@RestController
@RequestMapping("/api/public/tutor")
public class TutorIaController {

    private final AiService aiService;

    public TutorIaController(AiService aiService) {
        this.aiService = aiService;
    }

    @PostMapping("/chat")
    public ResponseEntity<IaChat> createChat(@RequestParam String title, @AuthenticationPrincipal CustomUserDetails userDetails) {
        IaChat newChat = aiService.startNewChat(title, userDetails);
        return ResponseEntity.status(HttpStatus.CREATED).body(newChat);
    }

    @PostMapping("/chat/{chatId}/ask")
    @PreAuthorize("@securityEvaluator.isChatOwner(#chatId, principal)")
    public ResponseEntity<String> askTutor(@PathVariable Long chatId, @RequestParam String ask) {
        String response = aiService.chatTutor(chatId, ask);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/user/{userId}/chats")
    @PreAuthorize("@securityEvaluator.isChatOwner(#chatId, principal)")
    public ResponseEntity<List<IaChat>> getUserChats(@PathVariable Long userId) {
        List<IaChat> chats = aiService.getChatsByUser(userId);
        return ResponseEntity.ok(chats);
    }

    @GetMapping("/chat/{chatId}")
    @PostAuthorize("@securityEvaluator.isChatOwner(#chatId, principal)")
    public ResponseEntity<IaChat> getChat(@PathVariable Long chatId) {
        IaChat chat = aiService.getChatById(chatId);
        return ResponseEntity.ok(chat);
    }

    @GetMapping("/chat/{chatId}/history")
    @PreAuthorize("@securityEvaluator.isChatOwner(#chatId, principal)")
    public ResponseEntity<List<TutorIaInteractions>> getHistory(@PathVariable Long chatId) {
        List<TutorIaInteractions> history = aiService.getChatHistory(chatId);
        return ResponseEntity.ok(history);
    }

    @DeleteMapping("/chat/{chatId}")
    @PreAuthorize("@securityEvaluator.isChatOwner(#chatId, principal)")
    public ResponseEntity<Void> deleteChat(@PathVariable Long chatId) {
        aiService.removeChat(chatId);
        return ResponseEntity.noContent().build();
    }

}
