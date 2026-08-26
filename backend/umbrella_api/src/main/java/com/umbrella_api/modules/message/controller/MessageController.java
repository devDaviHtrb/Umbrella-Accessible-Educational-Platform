package com.umbrella_api.modules.message.controller;

import com.umbrella_api.common.security.CustomUserDetails;
import com.umbrella_api.modules.message.dto.SendMessageRequest;
import com.umbrella_api.modules.message.model.MessageType;
import com.umbrella_api.modules.message.service.MessageService;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;


@Controller
@RequestMapping("/api/logged")
public class MessageController {
    private final MessageService messageService;

    public MessageController(MessageService messageService) {
        this.messageService = messageService;
    }

    @MessageMapping("/message/{type}")
    @PreAuthorize("isAuthenticated()")
    public void sendMessagePerson(
            @PathVariable String type,
            SendMessageRequest request,
            Authentication authentication
    ) {
        CustomUserDetails principal = (CustomUserDetails) authentication.getPrincipal();

        Long senderId = principal.getUserModel().getId();

        MessageType messagetype;

        if(type.equals("user"))
            messagetype = MessageType.PERSONAL;
        else if(type.equals("course"))
            messagetype = MessageType.COURSE;
        else
            throw new IllegalArgumentException(
                    "Message needs a type"
            );

        messageService.sendMessage(
                senderId,
                request.getRecipientId(),
                request.getContent(),
                messagetype
        );
    }

}


