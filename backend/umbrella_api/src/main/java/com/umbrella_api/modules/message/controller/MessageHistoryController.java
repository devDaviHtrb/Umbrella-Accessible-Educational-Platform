package com.umbrella_api.modules.message.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.umbrella_api.common.security.CustomUserDetails;
import com.umbrella_api.modules.message.dto.MessageResponseDto;
import com.umbrella_api.modules.message.repository.MessageRepository;

/**
 * Endpoints REST para carregar o HISTÓRICO de mensagens persistidas (o envio em
 * tempo real continua pelo WebSocket). Antes o app não conseguia mostrar
 * conversas anteriores porque não havia como consultá-las.
 */
@RestController
@RequestMapping("/api/logged/messages")
public class MessageHistoryController {

    private final MessageRepository messageRepository;

    public MessageHistoryController(MessageRepository messageRepository) {
        this.messageRepository = messageRepository;
    }

    /** Histórico de uma conversa pessoal entre o usuário logado e {peerId}. */
    @GetMapping("/personal/{peerId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<MessageResponseDto>> personalHistory(
            @AuthenticationPrincipal CustomUserDetails user,
            @PathVariable Long peerId) {
        Long me = user.getUserModel().getId();
        return ResponseEntity.ok(
                MessageResponseDto.fromList(messageRepository.findConversation(me, peerId)));
    }

    /** Todas as mensagens pessoais que envolvem o usuário logado. */
    @GetMapping("/personal")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<MessageResponseDto>> allPersonal(
            @AuthenticationPrincipal CustomUserDetails user) {
        Long me = user.getUserModel().getId();
        return ResponseEntity.ok(
                MessageResponseDto.fromList(messageRepository.findPersonalForUser(me)));
    }

    /** Histórico de mensagens de um curso. */
    @GetMapping("/course/{courseId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<MessageResponseDto>> courseHistory(@PathVariable Long courseId) {
        return ResponseEntity.ok(
                MessageResponseDto.fromList(messageRepository.findByCourseIdOrderByDateTimeAsc(courseId)));
    }
}
