package com.umbrella_api.modules.message.service;

import com.umbrella_api.modules.message.model.MessageModel;
import com.umbrella_api.modules.message.model.MessageType;
import com.umbrella_api.modules.message.repository.MessageRepository;
import com.umbrella_api.modules.notification.service.NotificationService;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MessageService {

    private final MessageRepository messageRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final NotificationService notificationService;

    public MessageService(
            MessageRepository messageRepository,
            SimpMessagingTemplate messagingTemplate,
            NotificationService notificationService
    ) {
        this.messageRepository = messageRepository;
        this.messagingTemplate = messagingTemplate;
        this.notificationService = notificationService;
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
            // Notifica o destinatário da mensagem pessoal.
            notificationService.notifyMessage(
                    recipientId, senderId, savedMessage.getContent(), savedMessage.getId());
        } else {
            messagingTemplate.convertAndSend(
                    "/topic/group/" + recipientId,
                    savedMessage
            );
            // Notifica os alunos do curso (exceto o remetente). Aqui recipientId
            // é o courseId (ver contrato de sendMessage para COURSE).
            notificationService.notifyCourseStudents(
                    recipientId, senderId,
                    com.umbrella_api.modules.notification.model.NotificationType.MESSAGE,
                    "Nova mensagem no curso", savedMessage.getContent(), savedMessage.getId());
        }

        return savedMessage;
    }
}
