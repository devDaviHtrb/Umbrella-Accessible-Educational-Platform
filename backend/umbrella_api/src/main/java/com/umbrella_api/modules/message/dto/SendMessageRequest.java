package com.umbrella_api.modules.message.dto;

import com.umbrella_api.modules.message.model.MessageType;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SendMessageRequest {

    private Long recipientId;
    private String content;
    private MessageType type;

}
