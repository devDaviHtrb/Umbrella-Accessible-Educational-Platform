package com.umbrella_api.modules.message.service;

import com.umbrella_api.modules.message.model.MessageModel;
import com.umbrella_api.modules.message.model.MessageType;
import com.umbrella_api.modules.message.repository.MessageRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.lang.reflect.Type;
import java.time.LocalDateTime;

@Service
public class MessageService {
    private final MessageRepository messageRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public MessageService(
            MessageRepository messageRepository, SimpMessagingTemplate messagingTemplate
    ) {
        this.messageRepository = messageRepository;
        this.messagingTemplate = messagingTemplate;
    }
    /*
    private void notifyUser(

            Long userId,
            MessageModel notification
    ) {

        messagingTemplate.convertAndSendToUser(
                userId.toString(),
                "/queue/notifications",
                notification
        );
    }
    private void notifyGroup(
            Long groupId,
            MessageModel notification
    ) {

        messagingTemplate.convertAndSend(
                "/topic/group/" + groupId,
                notification
        );
    }
     */

    public MessageModel sendMessage(
            Long sender_id,
            Long recipient_id,
            String content,
            MessageType type
    ){
        if(recipient_id == null)
            throw new IllegalArgumentException(
                    "Message needs a recipient"
            );
        MessageModel message = new MessageModel();
        message.setSender_id(sender_id);
        message.setContent(content);
        message.setDateTime(LocalDateTime.now());

        if (type == MessageType.PERSONAL){
            message.setRecipient_id(recipient_id);
            MessageModel saved = messageRepository.save(message);

            messagingTemplate.convertAndSendToUser(
                    recipient_id.toString(),
                    "/queue/messages",
                    saved
            );

            return saved;
        }

        message.setCourse_id(recipient_id);
        MessageModel saved = messageRepository.save(message);

        messagingTemplate.convertAndSend(
                "/topic/group/" + recipient_id,
                saved
        );

        return saved;
    }


}
