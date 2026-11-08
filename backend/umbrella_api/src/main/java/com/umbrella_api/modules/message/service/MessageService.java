package com.umbrella_api.modules.message.service;

import com.umbrella_api.modules.message.model.MessageModel;
import com.umbrella_api.modules.message.model.MessageType;
import com.umbrella_api.modules.message.repository.MessageRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import java.lang.reflect.Type;
import java.time.LocalDateTime;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MessageService {

    private final MessageRepository messageRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public MessageService(
            MessageRepository messageRepository,
            SimpMessagingTemplate messagingTemplate
    ) {
        this.messageRepository = messageRepository;
        this.messagingTemplate = messagingTemplate;
    }

    @Transactional
    public MessageModel sendMessage(
            Long senderId,
            Long recipientId,
            String content,
            MessageType type
    ) {
        if (senderId == null) {
            throw new IllegalArgumentException("Remetente inválido");
        }

        if (recipientId == null) {
            throw new IllegalArgumentException("Destinatário inválido");
        }

        if (content == null || content.isBlank()) {
            throw new IllegalArgumentException("A mensagem está vazia");
        }

        MessageModel message = new MessageModel();
        message.setSenderId(senderId);
        message.setContent(content.trim());
        message.setDateTime(LocalDateTime.now());

        if (type == MessageType.PERSONAL) {
            message.setRecipientId(recipientId);
        } else if (type == MessageType.COURSE) {
            message.setCourseId(recipientId);
        } else {
            throw new IllegalArgumentException("Tipo de mensagem inválido");
        }

        MessageModel savedMessage = messageRepository.save(message);

        if (type == MessageType.PERSONAL) {
            messagingTemplate.convertAndSendToUser(
                    recipientId.toString(),
                    "/queue/messages",
                    savedMessage
            );
        } else {
            messagingTemplate.convertAndSend(
                    "/topic/group/" + recipientId,
                    savedMessage
            );
        }

        return savedMessage;
    }
}
