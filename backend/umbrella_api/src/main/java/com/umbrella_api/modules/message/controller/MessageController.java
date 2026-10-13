package com.umbrella_api.modules.message.controller;

import com.umbrella_api.common.security.CustomUserDetails;
import com.umbrella_api.modules.message.dto.SendMessageRequest;
import com.umbrella_api.modules.message.model.MessageType;
import com.umbrella_api.modules.message.service.MessageService;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class MessageController {

    private final MessageService messageService;

    public MessageController(MessageService messageService) {
        this.messageService = messageService;
    }

    @MessageMapping("/message/{type}")
    public void sendMessage(
            @DestinationVariable String type,
            SendMessageRequest request,
            Authentication authentication
    ) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new IllegalStateException("Usuário não autenticado");
        }

        // Neste exemplo, o nome do principal é o ID numérico do usuário.
        Long senderId = Long.parseLong(authentication.getName());

        MessageType messageType;

        if ("user".equals(type)) {
            messageType = MessageType.PERSONAL;
        } else if ("course".equals(type)) {
            messageType = MessageType.COURSE;
        } else {
            throw new IllegalArgumentException(
                    "Tipo de mensagem inválido: " + type
            );
        }

        messageService.sendMessage(
                senderId,
                request.getRecipientId(),
                request.getContent(),
                messageType
        );
    }
}
